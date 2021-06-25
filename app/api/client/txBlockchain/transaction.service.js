const Creator = require('../../../models/creator');
const Edition = require('../../../models/edition');

const Episode = require('../../../models/episode');
const User = require('../../../models/user');
const { BLOCKCHAIN_DATA } = require('../../../seed-data/blockchain');
const { isInBookShelf } = require('../../../utils/check');

const getTransactions = async ({ episodeId, userId }) => {
  const episode = await Episode.findById(episodeId);
  if (!episode) throw new Error('TRANSACTION.GET.INVALID_EPISODE');

  let role = 'guest';
  let inBookShelf = false;
  if (userId) {
    const user = await User.findById(userId).populate('role').lean();
    if (user) {
      role = user.role.role;
    }
  }
  if (role === 'customer') {
    inBookShelf = await isInBookShelf({ userId, episodeId });
  }
  console.log(role);
  if (role === 'guest' || role === 'creator' || !inBookShelf) {
    return getOneTransaction({ episodeId, isCreator: role === 'creator' });
  }
  return getUserTransactions({ episodeId, userId });
};

const getOneTransaction = async ({ episodeId, isCreator = false }) => {
  const episode = await Episode.findById(episodeId).populate('serie').lean();
  const creatorId = episode.serie.createdBy;
  const uCreatorId = await Creator.findById(creatorId).lean();

  const edition = await getEditionOf({
    episodeId,
    userId: uCreatorId.user,
    isCreator,
  });

  return [edition.txHash];
};

const getDetail = async ({ episodeId }) => {
  const episode = await Episode.findById(episodeId).populate('serie').lean();
  if (!episode) throw new Error('TRANSACTION.GET.EPISODE_INVALID');

  const editions = await Edition.find({
    episode: episodeId,
  }).lean();

  const creator = await Creator.findById(episode.serie.createdBy)
    .populate('user')
    .lean();
  const total = editions.length;
  const purchased = editions.filter(
    (edt) =>
      edt.status === 'public' &&
      edt.owner.toString() !== creator.user._id.toString()
  ).length;
  const forSale = editions.filter((edt) => edt.status === 'public').length;

  return {
    owner: 'ARIUM',
    total,
    purchased,
    forSale,
    created: episode.createdAt,
    tomochain: BLOCKCHAIN_DATA.blockchain,
    seriesName: episode.serie.name,
    contractID: BLOCKCHAIN_DATA.contractAddress,
    creatorAddress: creator.user.walletAddress,
  };
};

const getUserTransactions = async ({ episodeId, userId }) => {
  const editions = await Edition.find({ episode: episodeId, owner: userId });
  return editions.map((edit) => edit.txHash);
};
const getEditionOf = async ({ episodeId, userId, isCreator }) => {
  let edition = null;
  if (userId && isCreator) {
    edition = await Edition.findOne({
      episode: episodeId,
      owner: userId,
    }).lean();
  }

  if (!edition) {
    edition = await Edition.findOne({
      episode: episodeId,
      status: 'public',
    }).lean();
  }
  return edition;
};

module.exports = {
  getTransactions,
  getDetail,
};
