const mongoose = require('mongoose');

const { Schema } = mongoose;

const LandLotSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
    },
    lot: {
      type: String,
      required: true,
    },
    subLot: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);
const LandLot = mongoose.model('LandLot', LandLotSchema);

module.exports = LandLot;
