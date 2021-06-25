import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import EpisodeManagementService from './episodeManagement.serivce';
import { success } from '../../../utils/response-utils';

const api = express.Router();

api.get('/episode-management', CheckAuth, async (req, res) => {
  try {
    const episodes = await EpisodeManagementService.getEpisodes({
      userId: req.userInfo._id,
      ...req.query,
    });

    const series = await EpisodeManagementService.getSeries({
      ...req.query
    })

    return res.json(success({ episodes, series }));
  } catch (err) {
    return CommonError(req, err, res);
  }
});

module.exports = api;
