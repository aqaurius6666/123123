import express from 'express';
import CommonError from '../../library/error';
import { badRequest, success } from '../../../utils/response-utils';
import ReadService from './readManga.service';
import { CheckAuth } from '../../middlewares/auth.mid';

const api = express.Router();

const skipGuestQuery = function (middleware) {
  return function (req, res, next) {
    if (req.query.guest === 'true') return next();
    return middleware(req, res, next);
  };
};

api.get('/read/:serieId', skipGuestQuery(CheckAuth), async (req, res) => {
  try {
    const userId = req.userInfo && req.userInfo._id ? req.userInfo._id : '';
    const serie = await ReadService.getSerie({
      ...req.params,
      userId,
    });
    return res.json(success({ serie }));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

api.get(
  '/read/:serieId/:chapter',
  skipGuestQuery(CheckAuth),
  async (req, res) => {
    try {
      const userId = req.userInfo && req.userInfo._id ? req.userInfo._id : '';
      const { signedUrl, episode } = await ReadService.getSignedUrl({
        ...req.params,
        userId,
        ...req.query,
      });
      return res.json(success({ signedUrl, episode }));
    } catch (err) {
      console.log(err);
      return CommonError(req, err, res);
    }
  }
);

module.exports = api;
