import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import { success } from '../../../utils/response-utils';
import CheckMongoId from '../../library/checkMongoId';
import { isValidString } from '../../../utils/validate-utils';
const EditionService = require('./edition.service');

const api = express.Router();

api.get('/edition/:episodeId', CheckAuth, async (req, res) => {
  try {
    const episode = await EditionService.getEditionByEpisode({
      userId: req.userInfo._id,
      ...req.params,
    });
    return res.json(success({ episode }));
  } catch (error) {
    return CommonError(req, error, res);
  }
});
api.put('/edition/updateEdition', CheckAuth, async (req, res) => {
  try {
    const user = req.userInfo._id;
    const { body } = req;
    const result = await  EditionService.updateEdition({ user, ...body });
    return res.json(success({result}));
  } catch (error) {
    return CommonError(req, error, res);
  }
});
module.exports = api;
