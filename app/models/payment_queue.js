const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentQueueSchema = new Schema(
	{
		status: {
			type: String,
			enum: ['done', 'processing'],
			default: 'processing',
		},
		jobName: {
			type: String,
			default: 'payment-intent',
		},
		parameter: {
			type: String,
			require: true,
		},
		user: { type: Schema.Types.ObjectId, ref: 'Customer', require: true },
		cart: { type: Schema.Types.ObjectId, ref: 'Cart', require: true },
	},
	{ timestamps: true }
);

const PaymentQueue = mongoose.model('PaymentQueue', PaymentQueueSchema);

module.exports = PaymentQueue;
