import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const planPreliminaryTreatmentSchema = new Schema(
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
      thumbnail: {
        type: String,
      },
      hash: {
        type: String,
      },
      isMaster: {
        type: Boolean,
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
planPreliminaryTreatmentSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('productplanpreliminarytreatments');
    this.code = nextSeq;
  }
});
const ProductPlanPreliminaryTreatment = mongoose.model('ProductPlanPreliminaryTreatment', planPreliminaryTreatmentSchema);

module.exports = ProductPlanPreliminaryTreatment;
