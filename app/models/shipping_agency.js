const mongoose = require('mongoose');
const { generateRandomId } = require('../utils/crypto-utils');

const { Schema } = mongoose;

const ShippingAgencySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 80,
    },
    code: {
      type: String,
      unique: true,
      required: true,
      default: () => generateRandomId(),
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
      type: String, // 0: disable, 1 : enable
      required: true,
    },
    taxId: {
      type: String,
      required: true,
      unique: true,
    },
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
const ShippingAgency = mongoose.model('ShippingAgency', ShippingAgencySchema);

module.exports = ShippingAgency;
