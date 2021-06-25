const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conservation',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      require: true
    },
    content: {
      type: String,
      require: true,
    },
    type: {
      type: String,
      require: true,
      default: 'text',
    },
    sendAt: {
      type: Date,
      require: true,
    }
  },
  { timestamps: true },
);
const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
