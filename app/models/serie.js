const mongoose = require('mongoose');
const { Schema } = mongoose;

const SerieSchema = new Schema(
	{
		createdBy: { type: Schema.Types.ObjectId, ref: 'Creator', required: true },
		thumbnail: {
			type: String,
			required: true,
		},
		header: {
			type: String,
			required: true,
		},
		category:{
			type: String,
			required: true,
			enum: ['Video', 'Illustration', 'Comic', 'Music']
		},
		summary:{
			type: String,
		},
		name: {
			type: String,
			required: true,
		},
		isPublishing: {
			type: Boolean,
			default: true,
		},
		isNewRelease: {
			type: Boolean,
			default: false,
		},
		episodes: [{ type: Schema.Types.ObjectId, ref: 'Episode', default: [] }],
	},
	{ timestamps: true }
);
SerieSchema.statics.addEpisode = async function(serie, episodeId) {
	serie.episodes.push(episodeId)
	return serie.save()
}
SerieSchema.statics.removeEpisode = async function(serie, episodeId) {
	serie.episodes.splice(serie.episodes.indexOf(episodeId), 1)
	return serie.save()
}


SerieSchema.statics.switchStatus = async function(serie, status) {
	serie.isPublishing = status
	return serie.save()
}

SerieSchema.statics.markNewRelease = async function(serie) {
	serie.isNewRelease = true
	return serie.save()
}

SerieSchema.statics.unmarkNewRelease = async function(serie) {
	serie.isNewRelease = false
	return serie.save()
}

const Serie = mongoose.model('Serie', SerieSchema);

module.exports = Serie;
