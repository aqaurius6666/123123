import express from 'express';
import CommonError from '../../library/error';
import { badRequest, success } from '../../../utils/response-utils';
import WatchService from './watchVideo.service';
import { CheckAuth } from '../../middlewares/auth.mid';

const api = express.Router();

const skipGuestQuery = function (middleware) {
  return function (req, res, next) {
    if (req.query.guest === 'true') return next();
    return middleware(req, res, next);
  };
};

api.get('/watch/:serieId', skipGuestQuery(CheckAuth), async (req, res) => {
  try {
    const userId = req.userInfo && req.userInfo._id ? req.userInfo._id : '';
    const serie = await WatchService.getSerie({
      ...req.params,
      userId,
    });
    return res.json(success({ serie }));
  } catch (err) {
    return CommonError(req, err, res);
  }
});
api.get(
  '/watch/:serieId/:chapter',
  skipGuestQuery(CheckAuth),
  async (req, res) => {
    try {
      const userId = req.userInfo && req.userInfo._id ? req.userInfo._id : '';
      const {signedUrl, episode} = await WatchService.getSignedUrl({ ...req.params, userId });

      return res.json(success({signedUrl, episode}));
    } catch (err) {
      return CommonError(req, err, res);
    }
  }
);

module.exports = api;
