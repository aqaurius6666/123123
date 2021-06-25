import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import SeriesManagementService from './seriesManagement.service';
import { success } from '../../../utils/response-utils';
import Serie from '../../../models/serie';

const api = express.Router();

api.get('/series-management', CheckAuth, async (req, res) => {
  try {
    console.log(req.userInfo)
    const series = await SeriesManagementService.getSeries({
      userId: req.userInfo._id,
      ...req.query,
    });
    const count = await SeriesManagementService.getCount({
      userId: req.userInfo._id,
      ...req.query,
    });
    return res.json(success({ series, ...count}));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

api.put('/series-management', CheckAuth, async (req, res) => {
  try {
    const result = await SeriesManagementService.updateSeries({
      ...req.body,
      userId: req.userInfo._id,
    });

    return res.json(success({ result }));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

module.exports = api;
