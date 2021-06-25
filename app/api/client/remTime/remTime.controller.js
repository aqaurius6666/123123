import express from 'express';
import CommonError from '../../library/error';
import { badRequest, success } from '../../../utils/response-utils';
import RemTimeService from './remTime.service';
import { CheckAuth } from '../../middlewares/auth.mid';

const api = express.Router();

api.get('/getRemTime', CheckAuth, async (req, res) => {
  try {
    const userId = req.userInfo._id;
    const { seriesId, episodeId } = req.query;
    const remTime = await RemTimeService.getRemTime({
      userId,
      seriesId,
      episodeId
    });
    return res.json(success({ remTime }));
  } catch (error) {
    return CommonError(req, error, res);
  }
});

api.post('/updateRemTime', CheckAuth, async (req, res) => {
  try {
    const userId = req.userInfo._id;
    console.log(userId)
    const { seriesId, episodeId, time } = req.body;
    const status = await RemTimeService.updateRemTime({
      userId,
      seriesId,
      episodeId,
      time,
    });
    return res.json(success(status));
  } catch (error) {
    return CommonError(req, error, res);
  }
});

module.exports = api;
