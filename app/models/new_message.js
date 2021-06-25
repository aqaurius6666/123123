const mongoose = require('mongoose');

const { Schema } = mongoose;

const NewMessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conservation',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      require: true
    }
  },
  { timestamps: true },
);
const NewMessage = mongoose.model('NewMessage', NewMessageSchema);

module.exports = NewMessage;
