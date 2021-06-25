import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import { success } from '../../../utils/response-utils';
import EpisodeService from './episodes.service';
import express from 'express';

const api = express.Router();

const skipGuestQuery = function (middleware) {
	return function (req, res, next) {
		if (req.query.guest === 'true') return next();
		return middleware(req, res, next);
	};
};

api.get('/episode/pre-create', CheckAuth, async (req, res) => {
	try {
		const userInfo = req.userInfo;

		const info = await EpisodeService.getPreInfo___({ ...req.query, creatorId : userInfo._id})

		return res.json(success({ info }));
	} catch (err) {
		return CommonError(req, err, res);
	}
})

api.get('/episode/:episodeId', skipGuestQuery(CheckAuth), async (req, res) => {
	try {
		const { episodeId } = req.params;

		const userId = req.userInfo && req.userInfo._id ? req.userInfo._id : '';

		const episode = await EpisodeService.getByEpisodeId({
			userId,
			episodeId: episodeId,
		});

		return res.json(success({ episode }));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.post('/episode', CheckAuth, async (req, res) => {
	try {
		const creatorId = req.userInfo._id;
		const { body } = req
		const result = await EpisodeService.createEpisode({
			...body,
			creatorId
		})
		return res.json(success({ result }));
	} catch (err) {
		return CommonError(req, err, res);
	}
});


module.exports = api;
