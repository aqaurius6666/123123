import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const ManagementUnitSchema = new Schema(
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
    level: {
      type: Number,
      required: true,
      default: 0,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'ManagementUnit',
    },
  },
  { timestamps: true },
);
ManagementUnitSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('managementunit');
    this.code = nextSeq;
  }
});
const ManagementUnit = mongoose.model('ManagementUnit', ManagementUnitSchema);

module.exports = ManagementUnit;
