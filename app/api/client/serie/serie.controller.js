import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import { success } from '../../../utils/response-utils';
import EpisodeService from './serie.service';
import express from 'express';
import CheckMongoId from '../../library/checkMongoId';
import { isValidString } from '../../../utils/validate-utils';
import { uploadSerie } from './uploadSerie/upload.service';

const api = express.Router();

const skipGuestQuery = function (middleware) {
  return function (req, res, next) {
    if (req.query.guest === 'true') return next();
    return middleware(req, res, next);
  };
};
api.get('/serie', skipGuestQuery(CheckAuth), async (req, res) => {
  try {
    const { creator, page, limit } = req.query;
    const userId = req.userInfo && req.userInfo._id ? req.userInfo._id : '';
    if (!isValidString(creator) || !CheckMongoId(creator)) {
      return res.json(success([]));
    }

    const episodes = await EpisodeService.getByCreator({
      userId,
      creatorId: creator,
      page,
      limit,
    });

    return res.json(success(episodes));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

api.get(
  '/serie/:serieId',
  /*CheckAuth,*/ async (req, res) => {
    try {
      const { serieId } = req.params;

      if (!isValidString(serieId) || !CheckMongoId(serieId)) {
        return res.json(success([]));
      }

      const seri = await EpisodeService.getBySeriId({
        serieId,
        ...req.query,
      });

      return res.json(success(seri));
    } catch (err) {
      return CommonError(req, err, res);
    }
  }
);

api.post('/serie', CheckAuth, async (req, res) => {
  try {
    const series = await EpisodeService.postSerie({
      ...req.body,
      userId: req.userInfo._id,
    });
    return res.json(success({ series }));
  } catch (err) {
    console.log(err);
    return CommonError(req, err, res);
  }
});

module.exports = api;
