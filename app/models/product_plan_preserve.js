import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const planPreserveSchema = new Schema(
  {
    code: {
      type: String,
    },
    estimatedStartTime: {
      type: Date,
    },
    estimatedEndTime: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    temperature: {
      type: Number,
    },
    storageImage: [{
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
planPreserveSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('productplanpreserves');
    this.code = nextSeq;
  }
});
const ProductPlanPreserve = mongoose.model('ProductPlanPreserve', planPreserveSchema);

module.exports = ProductPlanPreserve;
