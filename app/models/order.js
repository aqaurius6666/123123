const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema(
	{
		_id: Schema.Types.ObjectId,
		transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
		user: { type: Schema.Types.ObjectId, ref: 'Customer' },
	},
	{ timestamps: true }
);

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
