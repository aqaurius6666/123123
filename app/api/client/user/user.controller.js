import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import UserService from './user.service';
import { success } from '../../../utils/response-utils';

const api = express.Router();

api.post('/user', async (req, res) => {
  try {
    console.log(req.body);
    const user = await UserService.createUser({ ...req.body });
    return res.json(success({ user }));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

api.get('/userStatus', async (req, res) => {
  try {
    const { username } = req.query;
    const isActive = await UserService.getUserStatus({
      username,
    });
    return res.json(success({ isActive }));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

api.get('/user/status', CheckAuth, async (req, res) => {
  try {
    const status = await UserService.getQueueStatus({
      userId: req.userInfo._id,
    });
    return res.json(success({ status }));
  } catch (err) {
    console.log(err);
    return CommonError(req, err, res);
  }
});



module.exports = api;
