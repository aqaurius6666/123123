import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const planCleaningSchema = new Schema(
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
    estimatedQuantity: {
      type: Number,
    },
    quantity: {
      type: Number,
    },
    imageBefore: [{
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
planCleaningSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('productplancleanings');
    this.code = nextSeq;
  }
});
const ProductPlanCleaning = mongoose.model('ProductPlanCleaning', planCleaningSchema);

module.exports = ProductPlanCleaning;
