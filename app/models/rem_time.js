const mongoose = require('mongoose');
const { Schema } = mongoose;

const RemTimeSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		episode: { type: Schema.Types.ObjectId, ref: 'Episode', required: true },
		series: { type: Schema.Types.ObjectId, ref: 'Serie', required: true },
		time: {
			type: Number,
			required: true,
		}
	},
	{ timestamps: true }
);

const RemTime = mongoose.model('RemTime', RemTimeSchema);

module.exports = RemTime;
