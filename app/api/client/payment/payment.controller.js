import express from 'express';
import { CheckAuth } from '../../middlewares/auth.mid';
import CommonError from '../../library/error';
import { success } from '../../../utils/response-utils';
import StripeService from './stripe.service';
import PaymentService, { deletePayment } from './payment.service';

const api = express.Router();

api.get('/payment', CheckAuth, async (req, res) => {
	try {
		const paymentMethods = await PaymentService.getAllPayment({
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success(paymentMethods));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.get('/payment/create-setup-intent', CheckAuth, async (req, res) => {
	try {
		const response = await StripeService.setupPaymentIntent({
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success(response));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.post('/payment/checkout', CheckAuth, async (req, res) => {
	try {
		console.log(req.body)
		const status = await PaymentService.checkoutOrder({
			...req.body,
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success({status}));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.get('/payment/status', CheckAuth, async (req, res) => {
	try {
		const response = await PaymentService.getStatus({
			userInfo: { ...req.userInfo.toJSON() },
		});

		return res.json(success({ isProcessed: response }));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.delete('/payment/:paymentMethod', CheckAuth, async (req, res) => {
	try {
		const { paymentMethod } = req.params;

		if (!paymentMethod) {
			throw new Error('PAYMENT.NOT_FOUND');
		}

		const response = await deletePayment({
			userInfo: { ...req.userInfo.toJSON() },
			paymentMethod,
		});

		return res.json(success(response));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

api.post('/payment', CheckAuth, async (req, res) => {
	try {
		const { paymentMethodInfo, nameOnCard, futureUsage } = req.body;

		const response = await PaymentService.addPayment({
			userInfo: { ...req.userInfo.toJSON() },
			paymentMethodInfo,
			nameOnCard,
			futureUsage,
		});

		return res.json(success(response));
	} catch (err) {
		return CommonError(req, err, res);
	}
});

module.exports = api;
