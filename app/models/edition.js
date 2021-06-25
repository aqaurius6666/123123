const mongoose = require('mongoose');
const Episode = require('./episode');
const { Schema } = mongoose;

const EditionSchema = new Schema(
	{
		episode: { type: Schema.Types.ObjectId, ref: 'Episode', require: true },
		tokenId: {
			type: String,
			required: true,
			unique: true,
		},
		status: {
			type: String,
			enum: ['unpublic', 'public'],
			required: true,
		},
		txHash: {
			type: String,
			required: true,
		},
		owner: { type: Schema.Types.ObjectId, ref: 'User', require: true },
	},
	{ timestamps: true }
);
EditionSchema.statics.publish = async function ({episodeId, owner, amount}) {
  const editions = await Edition.find({episode : episodeId, owner : owner, status : 'unpublic'}).limit(amount)
	const handler = editions.map(async (edt) => {
		edt.status = 'public'
		return edt.save()
	})
	return Promise.all(handler)
};
EditionSchema.statics.unpublish = async function ({ episodeId, owner }) {
  const editions = await Edition.find({episode : episodeId, owner : owner, status : 'public'})
	const handler = editions.map(async (edt) => {
		edt.status = 'unpublic'
		return edt.save()
	})
	return Promise.all(handler)
};
const Edition = mongoose.model('Edition', EditionSchema);

module.exports = Edition;
