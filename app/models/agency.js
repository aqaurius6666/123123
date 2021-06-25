import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const AgencySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 80,
    },
    type: {
      type: String, // 0: Agency, 1 : Shipping Agency
      required: true,
    },
    code: {
      type: String,
      unique: true,
      required: true,
    },
    storeLevel: {
      type: Schema.Types.ObjectId,
      ref: 'StoreLevel',
    },
    address: {
      address: {
        type: String,
        required: true,
        maxlength: 255,
      },
      city: {
        type: String,
        required: true,
        maxlength: 255,
      },
      district: {
        type: String,
        required: true,
        maxlength: 255,
      },
      state: {
        type: String,
        required: true,
        maxlength: 255,
      },
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    taxId: {
      type: String,
      required: true,
      unique: true,
    },
    shippingAddress: [
      {
        address: {
          type: String,
          required: true,
          maxlength: 255,
        },
        city: {
          type: String,
          required: true,
          maxlength: 255,
        },
        district: {
          type: String,
          required: true,
          maxlength: 255,
        },
        state: {
          type: String,
          required: true,
          maxlength: 255,
        },
        isDefault: {
          type: Boolean,
          required: true,
        },
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    images: [{
      path: {
        type: String,
      },
      thumbnail: {
        type: String,
      },
      hash: {
        type: String,
      },
    }],
  },
  { timestamps: true },
);
AgencySchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('agency');
    this.code = nextSeq;
  }
});
const Agency = mongoose.model('Agency', AgencySchema);

module.exports = Agency;
