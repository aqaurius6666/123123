import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const planPackingSchema = new Schema(
  {
    code: {
      type: String,
    },
    estimatedTime: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    estimatedExpireTimeStart: {
      type: Date,
    },
    estimatedExpireTimeEnd: {
      type: Date,
    },
    expireTimeStart: {
      type: Date,
    },
    expireTimeEnd: {
      type: Date,
    },
    packing: {
      type: Schema.Types.ObjectId,
      ref: 'Packing',
    },
    estimatedQuantity: {
      type: Number,
    },
    quantity: {
      type: Number,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'QRCode',
      },
    ],
    activeLocation: {},
    sampleImage: [{
      path: {
        type: String,
      },
      isMaster: {
        type: Boolean,
      },
      hash: {
        type: String,
      },
      thumbnail: {
        type: String,
      },
      takenBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      takenTime: {
        type: Date,
      },
      location: {
        type: { type: String },
        coordinates: [],
      },
    }],
    packingImage: [{
      path: {
        type: String,
      },
      isMaster: {
        type: Boolean,
      },
      thumbnail: {
        type: String,
      },
      hash: {
        type: String,
      },
      takenBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      takenTime: {
        type: Date,
      },
      location: {
        type: { type: String },
        coordinates: [],
      },
    }],
  },
  { timestamps: true },
);
planPackingSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('productplanpackings');
    this.code = nextSeq;
  }
});
const ProductPlanPacking = mongoose.model('ProductPlanPacking', planPackingSchema);

module.exports = ProductPlanPacking;
