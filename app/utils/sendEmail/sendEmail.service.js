import {
	MAIL_NAME,
	MAIL_PASS,
	CLIENT_ID,
	CLIENT_SECRET,
	REFRESH_TOKEN,
	ACCESS_TOKEN,
} from '../../environment';
const mailer = require('nodemailer');
const User = require('../../models/user');
const Code = require('../../models/code');
const uuid = require('uuid');

const {
	VerifyMailTemplate,
	ResetPasswordTemplate,
	VerifyOtpTemplate,
} = require('./MailTemplate');

const getVerifyUrl = (activeCode, userId, type) => {
	console.log({ activeCode, userId });
	let feUrl = 'http://test.dev.nftal.io/';
	// let feUrl = 'http://thuan.dev.nftal.io/';
	feUrl =
		feUrl +
		(type === 'resetPassword' ? 'reset-password?' : 'signup/verify-signup?');
	return feUrl + `activeCode=${activeCode}&id=${userId}`;
};

const getData = (to, href, type) => {
	let data = null;
	switch (type) {
		case 'resetPassword':
			data = {
				from: 'ARIUM <MAIL_NAME>',
				to,
				subject: '[ARIUM] Reset Password',
				html: ResetPasswordTemplate(href),
			};
			break;
		case 'verifyEmail':
			data = {
				from: 'ARIUM <MAIL_NAME>',
				to,
				subject: '[ARIUM] Verification Email',
				html: VerifyMailTemplate(href),
			};
			break;
		case 'verifyOTP':
			data = {
				from: 'ARIUM <MAIL_NAME>',
				to,
				subject: '[ARIUM] Verification Email',
				html: VerifyOtpTemplate(href),
			};
			break;
		default:
			throw new Error('INVALID_ACTION_TYPE');
	}
	return data;
};

const sendEmail = async (activeCode, username, type, otp = '') => {
	const smtpTransport = mailer.createTransport({
		service: 'gmail',
		auth: {
			// type: 'OAuth2',
			user: MAIL_NAME,
			pass: MAIL_PASS,
			// clientId: CLIENT_ID,
			// clientSecret: CLIENT_SECRET,
			// refreshToken: REFRESH_TOKEN,
			// accessToken: ACCESS_TOKEN,
		},
	});

	smtpTransport.verify((err, success) => {
		if (err) {
			console.log(err);
		}
	});

	const user = await User.findOne({
		username,
	});

	console.log(activeCode);

	const href = getVerifyUrl(activeCode, user._id, type);

	console.log(href);

	const mailData = getData(user.email, type === 'verifyOTP' ? otp : href, type);

	smtpTransport.sendMail(mailData, (error, response) => {
		if (error) {
			console.log(error);
		} else {
			console.log('sent mail successfully');
		}
		smtpTransport.close();
	});
};

const updateActiveCode = async ({ username, type }) => {
	console.log(username);
	const curr = new Date();
	setTimeout(() => {
		console.log({ d: new Date() - curr });
	}, 10000);

	let user = null;

	user = await User.findOne({
		username,
	});

	if (!user) {
		user = await User.findOne({
			email: username,
		});
	}

	if (!user) {
		throw new Error('USER.NOT_FOUND');
	}

	const existingCode = await Code.findOne({
		user: user._id,
		type: type === 'resetPassword' ? 'reset-password' : 'sign-up',
	});

	const newCodeValue = uuid.v1();

	console.log(existingCode);

	if (!existingCode) {
		const newCode = new Code({
			user: user._id,
			type: type === 'resetPassword' ? 'reset-password' : 'sign-up',
			value: newCodeValue,
			expireDate: new Date(new Date().getTime() + 5 * 60000),
		});

		await newCode.save();

		return newCodeValue;
	} else {
		const expireTime = existingCode.expireTime.getTime();

		const currentTime = new Date().getTime();

		console.log(existingCode.expireTime);

		console.log(new Date());

		console.log(expireTime, currentTime);

		if (expireTime < currentTime) {
			await Code.updateOne(
				{
					user: user._id,
					type: type === 'resetPassword' ? 'reset-password' : 'sign-up',
				},
				{
					$set: {
						value: newCodeValue,
						expireTime: new Date(currentTime + 5 * 60000),
						isVerified: false,
					},
				}
			);
			return existingCode.value;
		}

		const updateAtTime = existingCode.updatedAt.getTime();

		if (updateAtTime > currentTime - 60 * 1000) throw new Error('EMAIL.SPAM');

		await Code.updateOne(
			{
				user: user._id,
				type,
			},
			{
				$set: {
					expireTime: new Date(new Date(currentTime).getTime() + 5 * 60000),
					isVerified: false,
				},
			}
		);
		return existingCode.value;
	}
};

const verifyCode = async ({ activeCode, userId }) => {
	console.log(userId, activeCode);
	const user = await User.findOne({
		_id: userId,
	});

	if (!user) {
		throw new Error('USER.NOT_FOUND');
	}
	const existingCode = await Code.findOne({
		user: userId,
		value: activeCode,
	});

	console.log({existingCode})

	if (!existingCode) {
		throw new Error('CODE.NOT_EXIST');
	} else {
		await User.updateOne(
			{
				_id: userId,
			},
			{
				$set: {
					isActive: true,
				},
			}
		);
		await Code.findOneAndDelete({
			user: userId,
			value: activeCode,
		});
	}
	return { isVerified: true };
};

module.exports = {
	sendEmail,
	updateActiveCode,
	verifyCode,
};
