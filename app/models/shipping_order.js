import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;
const ShippingOrderSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
    },
    exportAgency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    importAgency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
    },
    importAgencyAddress: {

    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'QRCode',
      },
    ],
    exportOrder: {
      type: Schema.Types.ObjectId,
      ref: 'ExportOrder',
    },
    status: { // 1: Lệnh mới, 2: Đã lấy hàng, 3: Đã giao hàng
      type: String,
      required: true,
      enum: ['1', '2', '3'],
    },
    shipper: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    pickUpTime: {
      type: Date,
    },
    deliveryTime: {
      type: Date,
    },
  },
  { timestamps: true },
);
ShippingOrderSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('shippingorders');
    this.code = nextSeq;
  }
});
const ShippingOrder = mongoose.model('ShippingOrder', ShippingOrderSchema);

module.exports = ShippingOrder;
