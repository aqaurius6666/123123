import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import TransactionService from './transaction.service';
import { success } from '../../../utils/response-utils';

const skipGuestQuery = function (middleware) {
  return function (req, res, next) {
    if (req.query.guest === 'true') return next();
    return middleware(req, res, next);
  };
};

const api = express.Router();

api.get('/transaction', skipGuestQuery(CheckAuth), async (req, res) => {
  try {
    const { episodeId } = req.query;
    const userId = req.userInfo && req.userInfo._id ? req.userInfo._id : '';

    const txh = await TransactionService.getTransactions({
      episodeId,
      userId,
    });
    return res.json(success({ txh }));
  } catch (err) {
    console.log(err);
    return CommonError(req, err, res);
  }
});

api.get('/blockchain-detail', async (req, res) => {
  try {
    const { episodeId } = req.query;

    const detail = await TransactionService.getDetail({ episodeId });
    return res.json(success({ detail }));
  } catch (err) {
    console.log(err);
    return CommonError(req, err, res);
  }
});

module.exports = api;
