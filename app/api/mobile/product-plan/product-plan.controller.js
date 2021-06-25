import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import { getAllByField } from './product-plan.service/getAllByField';

import CommonError from '../../library/error';
import {
  success,
} from '../../../utils/response-utils';

const api = express.Router();

api.get('/m/product-plan/:productPlanField', CheckAuth, async (req, res) => {
  try {
    const { _id } = req.userInfo;
    const args = req.params;
    const { query } = req;
    console.log(req.userInfo, _id, req);
    const result = await getAllByField(args, query, _id);
    return res.json(success(result));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

module.exports = api;
