const mongoose = require('mongoose');

const { Schema } = mongoose;

const ConservationSchema = new Schema(
  {
    name: {
      type: String,
      require: true
    },
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      require: true,
    }]
  },
  { timestamps: true },
);
const Conservation = mongoose.model('Conservation', ConservationSchema);

module.exports = Conservation;
