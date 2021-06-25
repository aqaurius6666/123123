import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
		},
		username: {
			type: String,
		},
		publicKey: {
			type: String,
		},
		encryptedPrivateKey: {
			type: String,
		},
		token2FA: {
			type: String,
			default: '',
		},
		isVerifyEmail: {
			type: Boolean,
			require: true,
			default: false,
		},
		fullName: {
			type: String,
			maxlength: 254,
		},
		phone: {
			type: String,
			maxlength: 13,
		},
		email: {
			type: String,
			maxlength: 254,
			required: true,
			unique: true,
		},
		gender: {
			type: String, // 0 : female, 1: male
		},
		birthDay: {
			type: Date,
		},
		role: {
			type: Schema.Types.ObjectId,
			ref: 'Role',
			required: true,
		},
		walletKey: {
			type: String,
			required: true,
		},
		walletAddress: {
			type: String,
			required: true,
		},
		activeCode: {
			type: String,
			default: '',
		},
		expireDate: {
			type: Date,
			default: new Date(new Date().getTime() + 5 * 60000),
		},
		isActive: {
			type: Boolean,
			default: false,
		},
		coler: {
			type: String,
			require: true
		}
	},
	{ timestamps: true }
);

UserSchema.pre('validate', async function () {
	if (!this.code) {
		const nextSeq = await getNextSequence('users');
		this.code = nextSeq;
	}
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
