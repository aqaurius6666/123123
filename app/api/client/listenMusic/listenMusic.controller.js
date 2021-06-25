import express from 'express';
import CommonError from '../../library/error';
import { badRequest, success } from '../../../utils/response-utils';
import ListenService from './listenMusic.service';
import { CheckAuth } from '../../middlewares/auth.mid';

const api = express.Router();

const skipGuestQuery = function (middleware) {
  return function (req, res, next) {
    if (req.query.guest === 'true') return next();
    return middleware(req, res, next);
  };
};

api.get('/listen/:serieId', skipGuestQuery(CheckAuth), async (req, res) => {
  try {
    const userId = req.userInfo && req.userInfo._id ? req.userInfo._id : '';
    const serie = await ListenService.getSerie({
      ...req.params,
      userId,
    });

    return res.json(success({ serie }));
  } catch (err) {
    return CommonError(req, err, res);
  }
});
api.get(
  '/listen/:serieId/:chapter',
  skipGuestQuery(CheckAuth),
  async (req, res) => {
    try {
      const userId = req.userInfo && req.userInfo._id ? req.userInfo._id : '';
      const {signedUrl, episode} = await ListenService.getSignedUrl({ ...req.params, userId });

      return res.json(success({signedUrl, episode}));
    } catch (err) {
      return CommonError(req, err, res);
    }
  }
);

module.exports = api;
