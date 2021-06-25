import Episode from '../../../models/episode';
import Customer from '../../../models/customer';
import Edition from '../../../models/edition';
import Creator from '../../../models/creator';
import Serie from '../../../models/serie';
import { TaskQueue, Queue } from '../../../models/blockchain_queue';
import checkMongoId from '../../library/checkMongoId';
import { getLatestChap } from '../../library/getLatestChap';
import { createBatch } from '../edition/edition.service';
import { isArray, isInteger, isNumber } from 'lodash';
import {
  publishOnChainVu,
  unpublishOnChainVu,
  mint,
  mintFree,
} from '../../../utils/blockchain-utils';
import { extension_allowed, size_allowed } from '../../../services/s3/s3';

const checkLock = async ({ userId, episodeId, price }) => {
  if (price === 0) return false;
  if (!userId) return true;

  const customer = await Customer.findOne({ user: userId });
  const creator = await Creator.findOne({ user: userId });
  if (creator) return false;

  if (!customer) throw new Error('EPISODE.GET.CUSTOMER_NOT_FOUND');

  const bookshelf = customer.bookshelf.map((episodeId) => episodeId.toString());

  return bookshelf.indexOf(episodeId.toString()) === -1;
};

const getByEpisodeId = async ({ userId, episodeId, inPrivate = false }) => {
  const episode = await Episode.findById(episodeId).populate('serie').lean();
  if (!episode) throw new Error('EPISODE.GET.NOT_FOUND');
  if (
    !inPrivate &&
    (!episode.serie ||
      episode.serie.isPublishing === false ||
      episode.isPublishing === false)
  ) {
    return null;
  }
  const creator = await Creator.findById(episode.serie.createdBy);

  const editions = await Edition.find({
    episode: episodeId,
  }).lean();

  const total = editions.filter((edt) => edt.status === 'public').length;
  const purchased = editions.filter(
    (edt) =>
      edt.status === 'public' &&
      edt.owner.toString() !== creator.user.toString()
  ).length;
  const forSale = editions.filter((edt) => edt.status === 'public').length;
  const isLocked = await checkLock({ userId, episodeId, price: episode.price });
  return {
    ...episode,
    totalEdition: total,
    remainEdition: forSale - purchased,
    isMarked: false,
    serie: null,
    key: null,
    isLocked,
    episodeId,
    serieId: episode.serie._id,
    seriesName: episode.serie.name,
    category: episode.serie.category,
  };
};

const createEpisode = async ({
  creatorId,
  title,
  isFree = false,
  editions,
  thumbnail,
  key,
  serieId: serie,
  pageNumber,
  description,
  thumbnailVideo
}) => {
  if (!checkMongoId(creatorId) || !checkMongoId(serie))
    throw new Error('EPISODE.POST.INVALID_ID');

  if (isNumber(editions) && !isFree && Number(editions) > 1000)
    throw new Error('EPISODE.POST.BAD_EDITIONS');

  const creator = await Creator.findOne({ user: creatorId })
    .populate('user')
    .lean();
  if (!creator) throw new Error('EPISODE.POST.CREATOR_NOT_FOUND');
  const serieInDb = await Serie.findById(serie);
  if (!serieInDb) throw new Error('EPISODE.POST.SERIEID_INVALID');

  const creatorSeries = creator.series.map((serie) => serie._id.toString());
  if (creatorSeries.indexOf(serieInDb._id.toString()) === -1)
    throw new Error('EPISODE.POST.INVALID_SERIES');

  const page = isInteger(pageNumber) ? Number(pageNumber) : null;
  const chapter = getLatestChap(serie);
  const price = isFree ? 0 : 19.1;

  const episode = new Episode({
    price,
    chapter,
    name: title,
    thumbnail,
    serie,
    key,
    amount: isFree ? 1 : Number(editions),
    serie,
    isFree,
    pageNumber: page,
    description,
    thumbnailVideo
  });
  const result = await episode.save();
  const { _id: episodeId, amount } = result;
  await Serie.addEpisode(serieInDb, episodeId);

  let createNFT = null;
  switch (isFree) {
    case true:
      createNFT = createFree;
      break;
    case false:
      createNFT = createLimited;
      break;
  }
  try {
    const data = await createNFT({
      privateKey: creator.user.walletKey,
      episodeId,
      owner: creator.user._id,
      address: creator.user.walletAddress,
      isFree,
      amount,
      uri: `/episode/${episodeId}`,
      data: '',
      caller: creator.user._id
    });
    
    return data
  } catch (err) {
    console.log('delete');
    await Serie.removeEpisode(serieInDb, episodeId);
    await Episode.findByIdAndRemove(episodeId);
    throw err;
  }
};

// const createFree = async ({
//   privateKey,
//   owner,
//   episodeId,
//   isFree,
//   amount,
//   uri,
//   data = '',
//   address,
// }) => {
//   await mint({
//     privateKey,
//     episodeId,
//     isFree,
//     amount,
//     uri,
//     data,
//   });
//   const publish = await publishOnChainVu({
//     privateKey,
//     episodeId,
//     amount: 1,
//     data,
//   });
//   if (!isArray(publish.data.data))
//     throw new Error('EPISODE.POST.CREATE_FREE_FAILED');

//   const response = await mintFree({
//     episodeId,
//     privateKey,
//     to: address,
//     data,
//   });
//   const unpublish = await unpublishOnChainVu({ privateKey, episodeId, data });
//   if (!isArray(unpublish.data.data))
//     throw new Error('EPISODE.POST.CREATE_FREE_FAILED');

//   const episodeOnChain = response.data.data;
//   if (!episodeOnChain.length)
//     throw new Error('EPISODE.POST.CREATE_FREE_FAILED');
//   return createBatch({
//     userId: owner,
//     episodeId,
//     startId: Number(episodeOnChain[0].id),
//     amount: 1,
//     txHash: episodeOnChain[0].txHashL,
//   });
// };

const createFree = async ({
  privateKey,
  owner,
  episodeId,
  isFree,
  amount,
  uri,
  data = '',
  caller,
}) => {
  return 'Under maintenance!!!'
  // const response = await mint({
  //   privateKey,
  //   episodeId,
  //   isFree,
  //   amount,
  //   uri,
  //   data,
  // });

  // if (response.data.data === 'pending') {
  //   // handle pending
  //   await createNewQueue({
  //     privateKey,
  //     owner,
  //     episodeId,
  //     isFree,
  //     amount,
  //     uri,
  //     data,
  //     caller,
  //   })
  //   return 'pending'
  // }
  // const episodeOnChain = response.data.data;
  // if (!episodeOnChain) throw new Error('EPISODE.POST.CREATE_LIMITED_FAILED');
  // return createBatch({
  //   userId: owner,
  //   episodeId,
  //   startId: Number(episodeOnChain.startId),
  //   amount: Number(episodeOnChain.amount),
  //   txHash: episodeOnChain.txHash,
  // });
};

const createLimited = async ({
  privateKey,
  owner,
  episodeId,
  isFree,
  amount,
  uri,
  data = '',
  caller,
}) => {
  const response = await mint({
    privateKey,
    episodeId,
    isFree,
    amount,
    uri,
    data,
  });
  console.log(response.data.data)
  if (response.data.data.status === 'pending') {
    // handle pending
    await createNewQueue({
      privateKey,
      owner,
      episodeId,
      isFree,
      amount,
      uri,
      data,
      caller,
    })
    return 'pending'
  }
  const episodeOnChain = response.data.data;
  if (!episodeOnChain) throw new Error('EPISODE.POST.CREATE_LIMITED_FAILED');
  return createBatch({
    userId: owner,
    episodeId,
    startId: Number(episodeOnChain.startId),
    amount: Number(episodeOnChain.amount),
    txHash: episodeOnChain.txHash,
  });
};

const getPreInfo___ = async ({ creatorId, serieId }) => {
  const creator = await Creator.findOne({ user: creatorId }).lean();
  if (!creator) throw new Error('EPISODE.GET.INVALID_CREATOR_ID');
  console.log({ creatorId, serieId });
  const serie = await Serie.findOne({
    createdBy: creator._id,
    _id: serieId,
  }).lean();
  if (!serie) throw new Error('EPISODE.GET.INVALID_SERIE_ID');

  const formatAllowed = getFormatAllowed(serie.category);
  const sizeAllowed = getSizeAllowed(serie.category);

  return { ...serie, formatAllowed, sizeAllowed };
};

const getFormatAllowed = (category) => {
  switch (category) {
    case 'Comic':
      return extension_allowed.read;
    case 'Video':
      return extension_allowed.watch;
    case 'Music':
      return extension_allowed.watch;
    case 'Illustration':
      return extension_allowed.read;
  }
  throw new Error('EPISODE.GET.INTERNAL_ERROR');
};

const getSizeAllowed = (category) => {
  switch (category) {
    case 'Comic':
      return size_allowed.read;
    case 'Video':
      return size_allowed.watch;
    case 'Music':
      return size_allowed.watch;
    case 'Illustration':
      return size_allowed.read;
  }
  throw new Error('EPISODE.GET.INTERNAL_ERROR');
};

const createNewQueue = async ({
  privateKey,
  owner,
  episodeId,
  isFree,
  amount,
  uri,
  data = '',
  caller,
}) => {
  const queue = new Queue({ status: 'pending', caller });
  const sQ = await queue.save();
  const mintTask = new TaskQueue({
    status: 'pending',
    name: 'blockchain.mint',
    queue: sQ._id,
    params: JSON.stringify({
      privateKey,
      episodeId,
      isFree,
      amount,
      uri,
      data,
    })
  });
  const sT = await mintTask.save()
  return Queue.findOneAndUpdate({ _id : sQ._id }, {$push: {tasks: sT._id}}, {useFindAndModify : false})
};

module.exports = {
  getByEpisodeId,
  createEpisode,
  getPreInfo___,
};
