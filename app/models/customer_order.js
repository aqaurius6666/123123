import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;
const CustomerOrderSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
    },
    sellAgency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'QRCode',
      },
    ],
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: { type: String },
      coordinates: [],
    },
  },
  { timestamps: true },
);
CustomerOrderSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('customerorders');
    this.code = nextSeq;
  }
});
const CustomerOrder = mongoose.model('CustomerOrder', CustomerOrderSchema);

module.exports = CustomerOrder;
