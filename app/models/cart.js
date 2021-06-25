const mongoose = require('mongoose');
const { Schema } = mongoose;

const _cartItemSchema = new Schema({
	episode: { type: Schema.Types.ObjectId, ref: 'Episode' },
	quantity: {
		type: Number,
		required: true,
		min: 0,
	},
	price: {
		type: Number,
	}
});

const CartSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'Customer' },
		isShopping: {
			type: Boolean,
			required: true,
			default: true,
		},
		cartItems: [_cartItemSchema],
	},
	{ timestamps: true }
);

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;
