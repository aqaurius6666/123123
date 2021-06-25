import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const planHarvestingSchema = new Schema(
  {
    code: {
      type: String,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    quantity: {
      type: Number,
    },
    temperature: {
      type: Number,
    },
    humidity: {
      type: Number,
    },
    porosity: {
      type: Number,
    },
    imageBefore: [{
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
    imageInProgress: [{
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
    imageAfter: [{
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
planHarvestingSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('productplanharvestings');
    this.code = nextSeq;
  }
});
const ProductPlanHarvesting = mongoose.model('ProductPlanHarvesting', planHarvestingSchema);

module.exports = ProductPlanHarvesting;
