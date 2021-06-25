import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import { success } from '../../../utils/response-utils';
import CreatorService from './creator.service';

const api = express.Router();

api.get('/creator/export/transaction', CheckAuth, async (req, res) => {
	try {
		const transactionData = await CreatorService.exportTransaction({
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success(transactionData));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.get('/setting/cover', async (req, res) => {
	try {
		const { creator } = req.query;

		const cover = await CreatorService.getHomepageCoverImage({
			creator,
		});

		return res.json(success(cover));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.post('/setting/cover', CheckAuth, async (req, res) => {
	try {
		const { cover } = req.body;

		if (!cover) {
			throw new Error('COVER.INVALID');
		}

		const response = await CreatorService.setHomepageCoverImage({
			userInfo: req.userInfo,
			cover,
		});

		return res.json(success(response));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.delete('/setting/cover', CheckAuth, async (req, res) => {
	try {
		const response = await CreatorService.resetHomepageCoverImage({
			userInfo: req.userInfo,
		});

		return res.json(success(response));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

module.exports = api;
