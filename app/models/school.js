import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const SchoolSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },

    schoolName: {
      type: String,
      required: true,
      maxlength: 254,
    },
    email: {
      type: String,
      maxlength: 254,
    },
    location: {
      type: String,
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

// StudentSchema.pre('validate', async function () {
//   if (!this.code) {
//     const nextSeq = await getNextSequence('students');
//     this.code = nextSeq;
//   }
// });
const School = mongoose.model('School', SchoolSchema);

module.exports = School;
