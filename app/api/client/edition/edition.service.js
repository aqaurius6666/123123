import Edition from '../../../models/edition';
import Creator from '../../../models/creator';
import checkMongoId from '../../library/checkMongoId';
import Episode from '../../../models/episode';
import {
  publishOnChainVu,
  unpublishOnChainVu,
} from '../../../utils/blockchain-utils';

import { BLOCKCHAIN_DATA } from '../../../seed-data/blockchain';
import { isArray } from 'lodash';

const Promise = require('bluebird');

const getEditionByEpisode = async ({ userId, episodeId }) => {
  if (!checkMongoId(userId) || !checkMongoId(episodeId))
    throw new Error('INVALID_MONGO.ID');

  const creator = await Creator.findOne({ user: userId });
  if (!creator) throw new Error('EDITION.GET.CREATOR_NOT_FOUND');

  const episode = await Episode.findById(episodeId).populate('serie').lean();
  if (!episode) throw new Error('EDITION.GET.EPISODE_ID_INVALID');

  if (episode.serie.createdBy.toString() !== creator._id.toString())
    throw new Error('EDITION.GET.NO_PERMISSION');
  const editions = await Edition.find({
    episode: episodeId,
  });
  const total = editions.length;
  const inventory = editions.filter(
    (edt) =>
      edt.status === 'unpublic' &&
      edt.owner.toString() === creator.user.toString()
  ).length;
  const purchased = editions.filter(
    (edt) =>
      edt.status === 'public' &&
      edt.owner.toString() !== creator.user.toString()
  ).length;
  const forSale = editions.filter((edt) => edt.status === 'public').length;

  return {
    ...episode,
    serie: null,
    serieName: episode.serie.name,
    key: null,
    total,
    inventory,
    forSale,
    purchased,
  };
};
const createEdition = async (user, episodeId, txHash) => {
  if (!checkMongoId(user) || !checkMongoId(episodeId))
    throw new Error('INVALID_MONGO.ID');
  const creator = await Creator.findOne({ user });
  if (!creator) throw new Error('HAVE_NO_PERMISSION');
  const episode = await Episode.findById(episodeId);
  if (!episode) throw new Error('EDITION.POST.INVALID_EPISODE');

  const edition = new Edition({
    episode: episodeId,
    status: 'unpublic',
    txHash,
    owner: user,
  });

  const result = await edition.save();
  return result;
};

const createBatch = async ({ userId, episodeId, startId, amount, txHash }) => {
  if (!checkMongoId(userId) || !checkMongoId(episodeId))
    throw new Error('INVALID_MONGO.ID');
  const creator = await Creator.findOne({ user: userId });
  if (!creator) throw new Error('HAVE_NO_PERMISSION');
  const episode = await Episode.findById(episodeId);
  if (!episode) throw new Error('EDITION.POST.INVALID_EPISODE');

  return Promise.map(
    Array.from(Array(amount).keys()),
    async (i) => {
      const edition = new Edition({
        episode: episodeId,
        tokenId: startId + i,
        status: 'unpublic',
        txHash,
        owner: userId,
      });
      return edition.save();
    },
    { concurrency: 10 }
  );
};

const updateEdition = async ({
  user,
  action,
  episodeId,
  publishNumber,
  price,
}) => {
  if (!checkMongoId(user) || !checkMongoId(episodeId))
    throw new Error('INVALID_MONGO.ID');
  const creator = await Creator.findOne({
    user,
  })
    .populate('user')
    .lean();
  if (!creator) throw new Error('HAVE_NO_PERMISSION');

  let handlerFunction = null;
  switch (action) {
    case 'publish':
      handlerFunction = publishEdition;
      break;
    case 'unpublish':
      handlerFunction = unpublishEdition;
      break;
    default:
      throw new Error('EPISODE_MANAGEMENT.PUT.INVALID_ACTION');
  }
  return handlerFunction({ user: creator, episodeId, publishNumber, price });
};
const publishEdition = async ({ user, episodeId, publishNumber, price }) => {
  const episode = await Episode.findById(episodeId);
  if (!episode) throw new Error('EPISODE_NOT_FOUND');

  const amount = Number(publishNumber);

  const editions = await Edition.find({
    owner: user.user._id,
    status: 'unpublic',
    episode: episodeId,
  });
  if (amount > editions.length)
    throw new Error('EDITION.PUT.INVALID_PUBLISH_NUMBER');
  const shouldSkip = await skipBlockChain({ episodeId });
  if (!shouldSkip) {
    const publish = await publishOnChainVu({
      privateKey: user.user.walletKey,
      episodeId,
      amount,
      data: '',
    });
    if (!isArray(publish.data.data))
      throw new Error('EPISODE_MANAGEMENT.PUT.PUBLISH_ON_BLOCKCHAIN_FAILED');
  }
  const p = Number(Number(price ? price : 0).toFixed(2));

  return Episode.publish({ episode, owner: user.user._id, amount, price: p });
};

const unpublishEdition = async ({ user, episodeId }) => {
  const episode = await Episode.findById(episodeId);
  if (!episode) throw new Error('EPISODE_NOT_FOUND');
  const shouldSkip = await skipBlockChain({ episodeId });
  if (!shouldSkip) {
    const unpublish = await unpublishOnChainVu({
      privateKey: user.user.walletKey,
      episodeId,
      data: '',
    });
    if (!isArray(unpublish.data.data))
      throw new Error('EPISODE_MANAGEMENT.PUT.UNPUBLISH_ON_BLOCKCHAIN_FAILED');
  }

  return Episode.unpublish({ episode, owner: user.user._id });
};


const skipBlockChain = async ({ episodeId }) => {
  const edition = await Edition.findOne({ episode: episodeId });
  if (edition.txHash === BLOCKCHAIN_DATA.txh) return true;
  return false;
};

module.exports = {
  getEditionByEpisode,
  createEdition,
  updateEdition,
  createBatch,
};
