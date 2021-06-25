const mongoose = require('mongoose');
const { Schema } = mongoose;

const CreatorSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		series: [{ type: Schema.Types.ObjectId, ref: 'Serie', default: [] }],
		cover: {
			type: String,
			required: true,
			trime: true,
			default:
				'https://nftjapan.s3.ap-southeast-1.amazonaws.com/image/be3bc26a-565e-499b-aa69-967baa1c6fdb-KEY%20VUSUAL%201.png',
		},
	},
	{ timestamps: true }
);

CreatorSchema.statics.addSeries = async function (creator, seriesId) {
	creator.series.push(seriesId);
	return creator.save();
};

const Creator = mongoose.model('Creator', CreatorSchema);

module.exports = Creator;
