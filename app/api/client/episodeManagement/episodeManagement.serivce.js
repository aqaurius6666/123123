const Creator = require('../../../models/creator');
const Edition = require('../../../models/edition');
const Episode = require('../../../models/episode');
const Serie = require('../../../models/serie');
const { getPagination } = require('../../../utils/pagination');
const { decreaseChapter } = require('../../../utils/check');
const checkMongoId = require('../../library/checkMongoId');

const getEpisodes = async ({
  userId,
  seriesId,
  page,
  limit,
  isPublishing = 'true',
}) => {
  if (!checkMongoId(userId))
    throw new Error('EPISODE_MANAGEMENT.GET.INVALID_ID');

  const creator = await Creator.findOne({ user: userId }).lean();
  if (!creator) throw new Error('EPISODE_MANAGEMENT.GET.CREATOR_NOT_FOUND');

  const { series } = creator;
  if (!series.length) throw new Error('EPISODE_MANAGEMENT.GET.SERIES_EMPTY');
  const episodes = await Episode.find({ serie: seriesId }).lean();
  if (episodes.length === 0)
    return []

  if (series.map((s) => s.toString()).indexOf(seriesId) === -1)
    throw new Error('EPISODE_MANAGEMENT.GET.NO_PERMISSION');

  const all = await Promise.all(
    episodes.map(async (e) => {
      const editions = await Edition.find({
        episode: e._id,
      }).lean();
      return {
        ...e,
        key: null,
        total: editions.length,
        inventory: editions.filter(
          (edt) =>
            edt.status === 'unpublic' &&
            edt.owner.toString() === creator.user.toString()
        ).length,
        purchased: editions.filter(
          (edt) =>
            edt.status === 'public' &&
            edt.owner.toString() !== creator.user.toString()
        ).length,
        forSale: editions.filter((edt) => edt.status === 'public').length,
      };
    })
  );

  return getPagination({
    array: all
      .filter((a) => isPublishing === a.isPublishing.toString()).sort(decreaseChapter),
    page,
    limit,
  });
};

const getSeries = async ({ seriesId }) => {
  if (!checkMongoId(seriesId))
    throw new Error('EPISODE_MANAGEMENT.GET.INVALID_SERIES_ID');
  const series = await Serie.findById(seriesId).populate('episodes').lean();
  if (!series) throw new Error('EPISODE_MANAGEMENT.GET.SERIES_NOT_FOUND');
  const total = series.episodes.length;
  const publishingAmount = series.episodes.filter(
    (item) => item.isPublishing === true
  ).length;
  const unpublishedAmount = series.episodes.filter(
    (item) => item.isPublishing === false
  ).length;

  return {
    ...series,
    total,
    publishingAmount,
    unpublishedAmount,
    episodes: null,
  };
};

module.exports = {
  getEpisodes,
  getSeries,
};
