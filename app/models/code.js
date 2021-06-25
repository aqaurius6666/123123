const mongoose = require('mongoose');
const { Schema } = mongoose;

const CodeSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		type: {
			type: String,
			enum: [
				'reset-password',
				'verify-email',
				'email-authentication',
				'qr-authentication',
				'guest-email-authentication'
			],
			require: true,
		},
		value: {
			type: String,
			require: true,
			trim: true,
		},
		expireTime: {
			require: true,
			type: Date,
			default: new Date(new Date().getTime() + 5 * 60000),
		},
		isVerified: {
			type: Boolean,
			require: true,
			default: false,
		},
	},
	{ timestamps: true }
);

const Code = mongoose.model('Code', CodeSchema);

module.exports = Code;
