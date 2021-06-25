import Serie from '../../../models/serie';
import Episode from '../../../models/episode';
import S3 from '../../../services/s3/s3';
import Customer from '../../../models/customer';
import Edition from '../../../models/edition';
import Creator from '../../../models/creator';
import { isInBookShelf, checkLock } from '../../../utils/check';

const getSerie = async ({ userId, serieId }) => {
  const serie = await Serie.findOne({ _id: serieId })
    .populate('episodes')
    .lean();
  if (!serie) return null;
  const episodes = await Promise.all(
    serie.episodes.map(
      async ({ chapter, name, _id: episodeId, price, isPublishing }) => {
        const inBookShelf = await isInBookShelf({ userId, episodeId });
        const shouldShow = isPublishing || inBookShelf;
        const isLocked = price && !inBookShelf;

        if (!shouldShow) return null;
        return {
          chapter,
          name,
          isLocked,
          episodeId,
        };
      }
    )
  );
  return {
    ...serie,
    episodes: episodes.filter((e) => e !== null),
  };
};
const getEpisode = async (serieId, chapter) => {
  const episode = await Episode.findOne({
    chapter: Number(chapter),
    serie: serieId,
  })
    .populate('serie')
    .lean();

  if (!episode) return null;

  return episode;
};

const getSignedUrl = async ({ serieId, chapter, userId, page }) => {
  const episode = await getEpisode(serieId, chapter);

  if (!episode) {
    throw new Error('EPISODE.NOT_FOUND');
  }
  const isLocked = await checkLock({
    userId,
    episodeId: episode._id,
    price: episode.price,
  });

  const editions = await Edition.find({ episode: episode._id });
  const creator = await Creator.findById(episode.serie.createdBy);

  const total = editions.length;
  const forSale = editions.filter((edt) => edt.status === 'public').length;
  const purchased = editions.filter(
    (edt) =>
      edt.status === 'public' &&
      edt.owner.toString() !== creator.user.toString()
  ).length;

  const signedUrl = !isLocked ? S3.getSignedUrl(`${episode.key}`) : null;

  return {
    signedUrl,
    episode: {
      ...episode,
      isLocked,
      totalAmount: forSale,
      remainAmount: forSale - purchased,
      serieName: episode.serie.name,
      serie: null,
      key: null,
    },
  };
};



module.exports = {
  getEpisode,
  getSerie,
  getSignedUrl,
};
