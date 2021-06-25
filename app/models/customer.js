import { getNextSequence } from '../api/library/getNextCounter';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CustomerSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		carts: [{ type: Schema.Types.ObjectId, ref: 'Cart', default: [] }],
		paymentMethods: [
			{ type: Schema.Types.ObjectId, ref: 'PaymentMethod', default: [] },
		],
		bookshelf: [{ type: Schema.Types.ObjectId, ref: 'Episode', default: [] }],
		stripeAccount: {
			type: String,
			require: true,
			unique: true,
			trim: true,
		},
		displayName: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
	},
	{ timestamps: true }
);

const Customer = mongoose.model('Customer', CustomerSchema);

module.exports = Customer;
