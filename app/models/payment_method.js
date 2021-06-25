const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentMethodSchema = new Schema(
	{
		nameOnCard: {
			type: String,
			require: true,
			trim: true,
		},
		card: {
			type: Object,
			require: true,
		},
		user: { type: Schema.Types.ObjectId, ref: 'Customer' },
		futureUsage: {
			type: Boolean,
			required: true,
			default: true,
		},
	},
	{ timestamps: true }
);

const PaymentMethod = mongoose.model('PaymentMethod', PaymentMethodSchema);

module.exports = PaymentMethod;
