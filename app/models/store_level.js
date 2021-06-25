import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const StoreLevelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String, // 0: disable, 1: active
      required: true,
    },
    level: {
      type: Number,
      required: true,
      default: 0,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'StoreLevel',
    },
  },
  { timestamps: true },
);
StoreLevelSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('storelevel');
    console.log(nextSeq);
    this.code = nextSeq;
  }
});
const StoreLevel = mongoose.model('StoreLevel', StoreLevelSchema);

module.exports = StoreLevel;
