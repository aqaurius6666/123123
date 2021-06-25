const mongoose = require('mongoose');

const { Schema } = mongoose;

const SystemFunctionSchema = new Schema(
  {
    product: [{
      type: String,
      required: true,
    }],
    agency: [{
      type: String,
      required: true,
    }],
  },
  { timestamps: true },
);
const SystemFunction = mongoose.model('SystemFunction', SystemFunctionSchema);

module.exports = SystemFunction;
