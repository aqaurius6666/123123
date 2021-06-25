const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransactionSchema = new Schema(
  {
    fee: {
      type: Number,
      require: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      require: true,
    },
		txHash: {
			type: String,
			require: true
		},
		cart: {
			type: Schema.Types.ObjectId,
			ref: 'Cart',
			require: true,
		}
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
