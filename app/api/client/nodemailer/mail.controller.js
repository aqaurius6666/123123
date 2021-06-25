import express from 'express';
import CommonError from '../../library/error';
import { success } from '../../../utils/response-utils';
import EmailService from '../../../utils/sendEmail/send-email-v2';

const api = express.Router();

api.post('/sendVerifyEmail', async (req, res) => {
  try {
    const { username, type } = req.body;
    console.log(req.body)
    const activeCode = await EmailService.updateActiveCode({username, type});
    console.log({activeCode})
    const results = await EmailService.sendEmailv2({activeCode, email:username, type});
    return res.json(success({results}));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

api.post('/verifyCode', async (req, res) => {
  try {
    const { activeCode, userId } = req.body;
    console.log(req.body)
    const results = await EmailService.verifyCode({activeCode, userId});
    console.log(results)
    return res.json(success({results}));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

api.get('/checkCodeExpired', async (req, res) => {
  try {
    const { activeCode, userId } = req.query;
    console.log(req.query)
    const results = await EmailService.checkCodeExpired({activeCode, userId});
    console.log(results)
    return res.json(success(results));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

module.exports = api;