import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import {
  getAll,
  getById,
  create,
} from './package.service';
import CommonError from '../../library/error';
import {
  success,
} from '../../../utils/response-utils';

const api = express.Router();

api.get('/package', CheckAuth, async (req, res) => {
  try {
    const args = req.query;
    const { _id } = req.userInfo;
    if (!args.species || args.species === '') delete args.species;

    const results = await getAll({ ...args, 'packedBy._id': _id });

    return res.json(success(results));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

api.get('/package/:packageId', CheckAuth, async (req, res) => {
  try {
    const args = req.params;

    const result = await getById(args);

    return res.json(success(result));
  } catch (err) {
    return CommonError(req, err, res);
  }
});
api.post('/package', CheckAuth, async (req, res) => {
  try {
    const { _id } = req.userInfo;
    const { body } = req;
    const result = await create(body, _id);
    return res.json(success(result));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

module.exports = api;
