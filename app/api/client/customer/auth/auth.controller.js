import { info } from '../../../../services/logger';
import { CheckCustomerAuth } from '../../../middlewares/customer.auth.mid';

const api = require('express').Router();
const {
  success,
  serverError,
} = require('../../../../utils/response-utils');
const Customer = require('../../../../models/customer');
const { error } = require('../../../../services/logger');

api.post('/auth/customer/credential', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      throw new Error('AUTH.ERROR.INVALID_REQUEST');
    } else {
      const user = await Customer.findOne({ username }).select(
        'username lastName firstName publicKey encryptedPrivateKey ',
      );
      if (user) {
        return res.json(success(user));
      }
      throw new Error('AUTH.ERROR.USER_NOT_FOUND');
    }
  } catch (err) {
    error(`${req.method} ${req.originalUrl}`, err.message);
    return res.json(serverError(err.message));
  }
});
api.post('/auth/customer/ping', CheckCustomerAuth, async (req, res) => {
  try {
    const user = await Customer.findOne({
      username: req.body.certificateInfo.username,
    });
    if (user) {
      return res.json(success(user));
    }
    throw new Error('AUTH.ERROR.USER_NOT_FOUND');
  } catch (err) {
    error(`${req.method} ${req.originalUrl}`, err.message);
    return res.json(serverError(err.message));
  }
});
api.post('/auth/customer/temp-password', CheckCustomerAuth, async (req, res) => {
  try {
    info(`${req.method} ${req.originalUrl}`, 123);
    const resData = req.body;
    const customerInfo = await Customer.findOne({ username: req.customerInfo.username });
    customerInfo.tempPassword = JSON.stringify({ ...resData });
    await customerInfo.save();
    return res.json(success(customerInfo));
  } catch (err) {
    error(`${req.method} ${req.originalUrl}`, err.message);
    return res.json(serverError(err.message));
  }
});
api.post('/auth/customer/password', CheckCustomerAuth, async (req, res) => {
  try {
    const resData = req.body;
    const customerInfo = await Customer.findOne({ username: req.customerInfo.username });
    customerInfo.password = JSON.stringify({ ...resData });
    customerInfo.publicKey = resData.publicKey;
    customerInfo.encryptedPrivateKey = resData.encryptedPrivateKey;
    customerInfo.tempPassword = null;
    await customerInfo.save();
    return res.json(success(customerInfo));
  } catch (err) {
    error(`${req.method} ${req.originalUrl}`, err.message);
    return res.json(serverError(err.message));
  }
});
module.exports = api;
