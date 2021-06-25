import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const SpeciesSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      unique: true,
      required: true,
    },
    barcode: {
      type: String,
      unique: true,
      required: true,
    },
    growingDays: {
      type: Number,
      required: true,
    },
    plantingDays: {
      type: Number,
      required: true,
    },
    expiryDays: {
      type: Number,
      required: true,
    },
    image: {
      path: {
        type: String,
      },
      thumbnail: {
        type: String,
      },
      hash: {
        type: String,
      },
    },
  },
  { timestamps: true },
);
SpeciesSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('species');
    this.code = nextSeq;
  }
});
const Species = mongoose.model('Specie', SpeciesSchema);

module.exports = Species;
