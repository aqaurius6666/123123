import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const ExportOrderSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
    },
    exportType: { // 1: Xuat kho bán lẻ, 2 : Xuất kho phân phối
      type: String,
      enum: ['1', '2'],
    },
    status: { // 1: Chờ xuất kho, 2 : Đợi lấy hàng, 3: Đã xuất kho
      type: String,
      enum: ['1', '2', '3'],
      required: true,
    },
    buyer: {
      name: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
    orderImage: {
      path: {
        type: String,
      },
      hash: {
        type: String,
      },
      thumbnail: {
        type: String,
      },
    },
    exportAgency: {
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
    importAgency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
    },
    importAgencyAddress: {

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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    exportedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);
ExportOrderSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('exportorders');
    this.code = nextSeq;
  }
});
const ExportOrder = mongoose.model('ExportOrder', ExportOrderSchema);

module.exports = ExportOrder;
