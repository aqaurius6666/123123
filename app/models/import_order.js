import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;
const ImportOrderSchema = new Schema(
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
    exportedAt: {
      type: Date,
    },
    shipping: {
      gsin: {
        type: String,
      },
      sscc: [],
      shipper: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'QRCode',
      },
    ],
    scannedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'QRCode',
      },
    ],
    pickUpTime: {
      type: Date,
    },
    deliveryTime: {
      type: Date,
    },
    exportOrder: {
      type: Schema.Types.ObjectId,
      ref: 'ExportOrder',
    },
    status: { // 1: Đợi vận chuyển, 2 : đang vận chuyển, 3: đã nhận hàng, 4: đã nhập kho
      type: String,
      required: true,
      enum: ['1', '2', '3', '4'],
    },
    importedAt: {
      type: Date,
    },
    importedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);
ImportOrderSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('importorders');
    this.code = nextSeq;
  }
});
const ImportOrder = mongoose.model('ImportOrder', ImportOrderSchema);

module.exports = ImportOrder;
