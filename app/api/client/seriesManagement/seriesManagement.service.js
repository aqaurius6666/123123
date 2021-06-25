const Creator = require('../../../models/creator');
const Episode = require('../../../models/episode');
const Serie = require('../../../models/serie');
const { getPagination } = require('../../../utils/pagination');
const checkMongoId = require('../../library/checkMongoId');

const getSeries = async ({ userId, page, limit, isPublishing = 'true' }) => {
  if (!checkMongoId(userId))
    throw new Error('SERIES_MANAGEMENT.GET.INVALID_ID');

  const creator = await Creator.findOne({ user: userId }).lean();
  if (!creator) throw new Error('SERIES_MANAGEMENT.GET.NOT_FOUND');

  const { series } = creator;
  if (!series) throw new Error('SERIES_MANAGEMENT.GET.SERIES_EMPTY');

  const _series = await Promise.all(
    series.map(async (serieId) => {
      const s = await Serie.findById(serieId).populate('episodes').lean();
      if (!s) {
        console.log(serieId);
        return null;
      }
      return handleSerie({ series: s, isPublishing });
    })
  );

  return getPagination({
    array: _series.filter((s) => s !== null),
    page,
    limit,
  });
};

const updateSeries = async ({ action, seriesId, userId }) => {
  if (!checkMongoId(seriesId) || !checkMongoId(userId))
    throw new Error('SERIES_MANAGEMENT.PUT.INVALID_ID');

  const series = await Serie.findById(seriesId).populate('episodes');
  if (!series) throw new Error('SERIES_MANAGEMENT.PUT.NOT_FOUND');

  const creator = await Creator.findOne({ user: userId });
  if (!creator) throw new Error('SERIES_MANAGEMENT.PUT.NOT_FOUND');

  if (creator._id.toString() !== series.createdBy.toString())
    throw new Error('SERIES_MANAGEMENT.PUT.PERMISSION_DENIED');

  let handlerFunction = null;
  switch (action) {
    case 'publish':
      handlerFunction = publishSeries;
      break;
    case 'unpublish':
      handlerFunction = unpublishSeries;
      break;
    case 'mark':
      handlerFunction = markNewRelease;
      break;
    case 'unmark':
      handlerFunction = unmarkNewRelease;
      break;
    default:
      throw new Error('SERIES_MANAGEMENT.PUT.INVALID_ACTION');
  }
  const result = await handlerFunction(series);
  return handleSerie({ series: result, isPublishing: result.isPublishing });
};

const publishSeries = async (series) => {
  return Serie.switchStatus(series, true);
};
const unpublishSeries = async (series) => {
  return Serie.switchStatus(series, false);
};
const markNewRelease = async (series) => {
  // const latestEpisode = series.episodes.pop();
  // const episode = await Episode.findById(latestEpisode);
  // await Episode.markNewRelease(episode);
  // return Serie.findById(series._id).populate('episodes').lean();
  await Serie.markNewRelease(series)
  return Serie.findById(series._id).populate('episodes').lean();
};

const unmarkNewRelease = async (series) => {
  // const status = 'unmark new release success!';
  // await Promise.all(
  //   series.episodes.map(async (episode) => {
  //     const epi = await Episode.findById(episode);
  //     return Episode.unmarkNewRelease(epi);
  //   })
  // );
  // return Serie.findById(series._id).populate('episodes').lean();
  await Serie.unmarkNewRelease(series)
  return Serie.findById(series._id).populate('episodes').lean();
};

// const checkNewRelease = (episodes) => {
//   if (episodes.length === 0) return false;
//   return episodes
//     .map((episode) => {
//       return episode.isNewRelease;
//     })
//     .reduce((res, cur) => {
//       return res || cur;
//     });
// };

const handleSerie = async ({ series, isPublishing }) => {
  const {
    _id,
    name,
    category,
    thumbnail,
    header,
    createdAt,
    updatedAt,
    episodes,
    isNewRelease
  } = series;
  // const isNewRelease = checkNewRelease(episodes);
  if (isPublishing.toString() !== series.isPublishing.toString()) return null;
  return {
    _id,
    name,
    category,
    thumbnail,
    header,
    episode: episodes.length,
    publish: createdAt,
    update: updatedAt,
    isNewRelease,
    isPublishing: series.isPublishing,
  };
};

const getCount = async ({ userId }) => {
  if (!checkMongoId(userId))
    throw new Error('SERIES_MANAGEMENT.GET.INVALID_ID');

  const creator = await Creator.findOne({ user: userId })
    .populate('series')
    .lean();
  if (!creator) throw new Error('SERIES_MANAGEMENT.GET.NOT_FOUND');

  const { series } = creator;
  const publishingAmount = series.filter((s) => s.isPublishing).length;
  const unpublishedAmount = series.filter((s) => !s.isPublishing).length;
  return { publishingAmount, unpublishedAmount };
};

module.exports = {
  getSeries,
  updateSeries,
  getCount,
};
