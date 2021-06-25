const { trimEnd } = require('lodash');
const mongoose = require('mongoose');
const Counter = require('./counter');
const Edition = require('./edition');
const { Schema } = mongoose;

const EpisodeSchema = new Schema(
  {
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    chapter: {
      type: Number,
      validate: {
        validator: Number.isInteger,
      },
    },
    amount: {
			type: Number,
			required: true,
		},
    name: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    thumbnailVideo: {
      type: String
    },
    thumbnail: {
      type: String,
      required: true,
      trim: true,
    },
    isNewRelease: {
      type: Boolean,
      required: true,
      default: false,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    pageNumber: {
      type: Number,
    },
    isPublishing: {
      type: Boolean,
      default: false,
    },
    serie: { type: Schema.Types.ObjectId, ref: 'Serie' },
  },
  { timestamps: true }
);

EpisodeSchema.statics.markNewRelease = async function (episode) {
  episode.isNewRelease = true;
  return episode.save();
};

EpisodeSchema.statics.unmarkNewRelease = async function (episode) {
  episode.isNewRelease = false;
  return episode.save();
};

EpisodeSchema.statics.unpublish = async function ({ episode, owner }) {
  episode.isPublishing = false;
  await Edition.unpublish({ episodeId : episode._id, owner});
  return episode.save();
};

EpisodeSchema.statics.publish = async function ({ episode, owner, amount = 1, price }) {
  episode.isPublishing = true;
	if (episode.price !== 0) {episode.price = price}
  await Edition.publish({ episodeId : episode._id, owner, amount});
  return episode.save();
};
EpisodeSchema.statics.isFree = function (episode) {
  return episode.price == 0;
};

const Episode = mongoose.model('Episode', EpisodeSchema);
module.exports = Episode;
