import Serie from '../../../models/serie';
import Episode from '../../../models/episode';
import Creator from '../../../models/creator';
import EpisodeService from '../episodes/episodes.service';
import { getPagination } from '../../../utils/pagination';

const getByCreator = async ({ userId, creatorId, page, limit }) => {
  const series = await Serie.find({ createdBy: creatorId, isPublishing: true })
    .populate('episodes')
    .lean();

  let isCreator = false;
  if (userId) {
    isCreator = await Creator.findOne({ user: userId });
  }
  const all = await Promise.all(
    series.map(async (serie) => {
      const { thumbnail, _id, name, category, isNewRelease } = serie;

      // const isNewRelease = serie.episodes.some(
      //   (episode) => episode.isNewRelease
      // );

      return {
        name,
        thumbnail,
        _id,
        category,
        isNewRelease,
        episodeQuantity: isCreator
          ? serie.episodes.length
          : serie.episodes.filter((e) => e.isPublishing).length,
      };
    })
  );
  return getPagination({array: all, page, limit})
};

const getBySeriId = async ({ serieId, page, limit }) => {
  const result = await Serie.findOne({
    _id: serieId,
    isPublishing: true,
  }).lean();
  if (!result) throw new Error('EPISODE.GET.SERIE_UNPUBLISHING');

  const episodes = await Promise.all(
    result.episodes.map(async (episodeId) => {
      const episodeInfo = await EpisodeService.getByEpisodeId({
        episodeId: episodeId,
      });
      return episodeInfo;
    })
  );

  return {
    ...result,
    episodes: getPagination({
      array: episodes.filter((e) => e !== null),
      page,
      limit,
    }),
  };
};

const postSerie = async ({
  userId,
  header,
  thumbnail,
  name,
  category,
  summary,
}) => {
  const creator = await Creator.findOne({
    user: userId,
  });
  if (!creator) {
    throw new Error('CREATOR.NOT_FOUND');
  }

  const categories = ['Video', 'Comic', 'Music', 'Illustration'];
  if (categories.indexOf(category) === -1)
    throw new Error('SERIE.POST.INVALID_CATEGORY');

  const serie = new Serie({
    createdBy: creator._id,
    header: header,
    thumbnail: thumbnail,
    name: name,
    category: category,
    summary: summary,
  });

  const saveSerie = await serie.save();

  await Creator.addSeries(creator, saveSerie._id);

  return saveSerie;
};

module.exports = {
  getByCreator,
  getBySeriId,
  postSerie,
};
