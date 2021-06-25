import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const PackingSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    species: {
      type: Schema.Types.ObjectId,
      ref: 'Specie',
      required: true,
    },
    weight: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);
PackingSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('packing');
    this.code = nextSeq;
  }
});
const Packing = mongoose.model('Packing', PackingSchema);

module.exports = Packing;
