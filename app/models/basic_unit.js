const mongoose = require('mongoose');

const { Schema } = mongoose;

const basicUnitSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
    },

    // caculationUnit: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "CaculationUnit",
    //   },
    // ],
  },
  { timestamps: true },
);

basicUnitSchema.index({ '$**': 'text' });

module.exports = mongoose.model('BasicUnit', basicUnitSchema);
