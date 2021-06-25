const {
	FRONTEND_BASE_URL,
	MAIL_NAME,
	MAIL_PASS,
} = require('../../environment');
const mailer = require('nodemailer');
const User = require('../../models/user');
const Code = require('../../models/code');
const uuid = require('uuid');

const {
	VerifyMailTemplate,
	ResetPasswordTemplate,
	VerifyOtpTemplate,
} = require('./MailTemplate');
const { existsSync } = require('fs');

const _getFrontendBaseURL = () => {
	console.log({ FRONTEND_BASE_URL });

	if (!FRONTEND_BASE_URL) {
		throw new Error('EMAIL.BASE_URL.INVALID');
	}

	return FRONTEND_BASE_URL;
};

const _generateURL = ({ type, activeCode, userId }) => {
	if (type === 'reset-password')
		return `${_getFrontendBaseURL()}/reset-password?code=${activeCode}&user=${userId}`;
	else
		return `${_getFrontendBaseURL()}/signup/verify-signup?activeCode=${activeCode}&id=${userId}`;
	return '';
};

const _configEmailTemplate = ({ to, href, type }) => {
	switch (type) {
		case 'reset-password':
			return {
				from: 'ARIUM <MAIL_NAME>',
				to,
				subject: '[ARIUM] Reset Password',
				html: ResetPasswordTemplate(href),
			};

		case 'verify-email':
			return {
				from: 'ARIUM <MAIL_NAME>',
				to,
				subject: '[ARIUM] Verification Email',
				html: VerifyMailTemplate(href),
			};

		case 'verify-otp':
			return {
				from: 'ARIUM <MAIL_NAME>',
				to,
				subject: '[ARIUM] Verification Email',
				html: VerifyOtpTemplate(href),
			};

		default:
			throw new Error('INVALID_ACTION_TYPE');
	}
};

const sendEmailv2 = async ({ activeCode, email, type }) => {
	const smtpTransport = mailer.createTransport({
		service: 'gmail',
		auth: {
			user: MAIL_NAME,
			pass: MAIL_PASS,
		},
	});

	await smtpTransport.verify((err) => {
		if (err) {
			throw new Error('GMAIL.SERVICE.FAILED');
		}
	});

	console.log({ email });

	const user = await User.findOne({
		email,
	});

	if (!user) {
		throw new Error('USER.NOT_FOUND');
	}

	const href = _generateURL({ type, activeCode, userId: user._id });

	console.log(href);

	const mailDataConfig = _configEmailTemplate({ to: user.email, href, type });

	return new Promise((resolve, reject) => {
		smtpTransport.sendMail(mailDataConfig, (error, response) => {
			if (error) {
				return reject('GMAIL.SERVICE.FAILEDD1');
			} else {
				smtpTransport.close();

				resolve(response);
			}
		});
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
		type: type,
	});

	const newCodeValue = uuid.v1();

	console.log(existingCode);

	if (!existingCode) {
		const newCode = new Code({
			user: user._id,
			type: type,
			value: newCodeValue,
			expireTime: new Date(new Date().getTime() + 5 * 6000000000),
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
					type: type,
				},
				{
					$set: {
						// value: newCodeValue,
						expireTime: new Date(currentTime + 5 * 6000000000),
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
					expireTime: new Date(new Date(currentTime).getTime() + 5 * 6000000000),
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

	console.log({ existingCode });

	if (!existingCode) {
		throw new Error('CODE.NOT_EXIST');
	} else {
		const expireTime = existingCode.expireTime.getTime();

		const currentTime = new Date().getTime();

		// if (expireTime < currentTime) throw new Error('CODE.EXPIRED_TIME');

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
		await Code.deleteOne({
			user: userId,
			value: activeCode,
		});
	}
	return { isVerified: true };
};

const checkCodeExpired = async ({ activeCode, userId }) => {
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

	console.log({ existingCode });

	if (!existingCode) throw new Error('MAIL.CODE_NOT_FOUND')

	const expireTime = existingCode.expireTime;
	const currentTime = new Date();

	console.log({expireTime, currentTime})

	return {expired: expireTime < currentTime}
}

module.exports = {
	sendEmailv2,
	updateActiveCode,
	verifyCode,
	checkCodeExpired,
};
