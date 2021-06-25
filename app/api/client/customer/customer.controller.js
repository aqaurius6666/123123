import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import { success } from '../../../utils/response-utils';
import CheckMongoId from '../../library/checkMongoId';
import { isValidString } from '../../../utils/validate-utils';
import { STRIPE_PUBLIC_KEY } from '../../../environment';
import { error } from '../../../services/logger';

const CustomerService = require('./customer.service');

const api = express.Router();

api.post('/customer/check-email-exist', async (req, res) => {
	try {
		const { email } = req.body;

		const response = await CustomerService.checkEmailExist({
			email,
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.post('/customer/forgot-password/verify', async (req, res) => {
	try {
		const { email } = req.body;

		const response = await CustomerService.verifyEmailForgotPw({
			email,
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.post('/customer/forgot-password/confirm', async (req, res) => {
	try {
		const { encryptedPrivateKey, publicKey, user, code } = req.body;

		const response = await CustomerService.confirmEmailForgotPw({
			encryptedPrivateKey,
			publicKey,
			user,
			code,
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.get('/customer/2fa/generate', CheckAuth, async (req, res) => {
	try {
		const response = await CustomerService.generateQRImage({
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.post('/customer/2fa/confirm', CheckAuth, async (req, res) => {
	try {
		const { otp, secret } = req.body;

		const response = await CustomerService.confirm2FA({
			userInfo: { ...req.userInfo.toJSON() },
			otp,
			secret,
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.post('/customer/gg-authentication/confirm', CheckAuth, async (req, res) => {
	try {
		const { otp } = req.body;

		const response = await CustomerService.confirmGoogleAuthentication({
			userInfo: { ...req.userInfo.toJSON() },
			otp,
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.post(
	'/customer/email-authentication/confirm',
	CheckAuth,
	async (req, res) => {
		try {
			const { otp, type } = req.body;

			const response = await CustomerService.confirmEmailAuthentication({
				userInfo: { ...req.userInfo.toJSON() },
				otp,
				type,
			});

			return res.json(success(response));
		} catch (err) {
			error(`${req.method} ${req.originalUrl}`, err.message);
			return CommonError(req, err, res);
		}
	}
);

api.post('/customer/email-authentication/guest-confirm', async (req, res) => {
	try {
		const { otp, email } = req.body;

		const response = await CustomerService.guestConfirmEmailAuthentication({
			email,
			otp,
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.post('/customer/gg-authentication/guest-confirm', async (req, res) => {
	try {
		const { otp, email } = req.body;

		const response = await CustomerService.guestConfirmGGAuthentication({
			email,
			otp,
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.get('/customer/2fa/verify-email', CheckAuth, async (req, res) => {
	try {
		const response = await CustomerService.verifyEmailFor2FA({
			userInfo: { ...req.userInfo.toJSON() },
			type: 'qr-authentication',
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.post('/customer/email-authentication/guest-verify', async (req, res) => {
	try {
		const { email } = req.body;

		const response = await CustomerService.guestVerifyEmail({
			email,
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.get(
	'/customer/email-authentication/verify',
	CheckAuth,
	async (req, res) => {
		try {
			const response = await CustomerService.verifyEmailFor2FA({
				userInfo: { ...req.userInfo.toJSON() },
				type: 'email-authentication',
			});

			return res.json(success(response));
		} catch (err) {
			error(`${req.method} ${req.originalUrl}`, err.message);
			return CommonError(req, err, res);
		}
	}
);

api.post('/customer/2fa/confirm-email', CheckAuth, async (req, res) => {
	try {
		const response = await CustomerService.confirmEmailFor2FA({
			userInfo: { ...req.userInfo.toJSON() },
			otp: req.body.otp,
			type: req.body.type,
		});

		return res.json(success({ isVerified: response }));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.get('/customer/2fa/confirm-turn-off', CheckAuth, async (req, res) => {
	try {
		const response = await CustomerService.confirmTurnOff2FA({
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success(response));
	} catch (err) {
		error(`${req.method} ${req.originalUrl}`, err.message);
		return CommonError(req, err, res);
	}
});

api.get(
	'/customer',
	/*CheckAuth,*/ async (req, res) => {
		try {
			const results = await CustomerService.getAll();

			return res.json(success(results));
		} catch (err) {
			return CommonError(req, err, res);
		}
	}
);

api.get('/customer/cart/', CheckAuth, async (req, res) => {
	try {
		const user = req.userInfo._id;
		const cart = await CustomerService.getCart({ user: user });
		return res.json(success(cart));
	} catch (err) {
		console.log(err);
		return CommonError(req, err, res);
	}
});

api.get('/customer/bookshelf', CheckAuth, async (req, res) => {
	try {
		const { creator: creatorId, serie: serieId } = req.query;
		if (!isValidString(creatorId) || !CheckMongoId(creatorId)) {
			return res.json(success([]));
		}

		const bookshelf = await CustomerService.getBookshelf({
			customerId: req.userInfo._id,
			serieId,
			creatorId,
		});

		return res.json(success(bookshelf));
	} catch (err) {
		console.log(err);

		return CommonError(req, err, res);
	}
});

api.get('/customer/api-key', async (req, res) => {
	try {
		return res.json(
			success({
				apiKey: STRIPE_PUBLIC_KEY,
			})
		);
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.get('/customer/profile/available', async (req, res) => {
	try {
		const { username } = req.query;

		const isAvailable = await CustomerService.checkUsernameAvailable({
			username,
		});

		return res.json(
			success({
				isAvailable,
			})
		);
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.post('/customer/profile/username', CheckAuth, async (req, res) => {
	try {
		const { username } = req.body;

		const userInfo = await CustomerService.editCustomerName({
			username,
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success(userInfo));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.post('/customer/profile/password', CheckAuth, async (req, res) => {
	try {
		const { currentPassword, publicKey, encryptedPrivateKey, newPassword } =
			req.body;

		const userInfo = await CustomerService.editCustomerPw({
			currentPassword,
			publicKey,
			encryptedPrivateKey,
			newPassword,
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success(userInfo));
	} catch (error) {
		return CommonError(req, error, res);
	}
});

api.get('/customer/profile', CheckAuth, async (req, res) => {
	try {
		const userInfo = await CustomerService.getCustomerProfile({
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success(userInfo));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.get(
	'/customer/:customerId',
	/*CheckAuth,*/ async (req, res) => {
		try {
			const {
				params: { customerId },
			} = req;

			const customer = await CustomerService.getByUserId({ user: customerId });

			return res.json(success(customer));
		} catch (err) {
			return CommonError(req, err, res);
		}
	}
);

api.post('/customer/cart', CheckAuth, async (req, res) => {
	try {
		const user = req.userInfo._id;
		const { episodeId, quantity } = req.body;

		const cart = await CustomerService.updateCartv2({
			user: user,
			episodeId: episodeId,
			quantity: quantity,
		});

		return res.json(success(cart));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.post('/customer/cart/multiple', CheckAuth, async (req, res) => {
	try {
		const user = req.userInfo._id;

		const { cartInfo } = req.body;

		const cart = await CustomerService.updateMutipleItemInCart({
			user: user,
			cartInfo,
		});

		return res.json(success(cart));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.post('/customer/bookshelf', CheckAuth, async (req, res) => {
	try {
		const user = req.userInfo._id;
		const { episodeId } = req.body;

		const bookshelf = await CustomerService.updateBookshelf({
			user,
			episodeId,
		});

		return res.json(success(bookshelf));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

module.exports = api;
