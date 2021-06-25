import Customer from '../models/customer'

const checkLock = async ({ userId, episodeId, price }) => {
  if (price === 0) return false;

  const inBookShelf = await isInBookShelf({ userId, episodeId });
  return !inBookShelf;
};

const isInBookShelf = async ({ userId, episodeId }) => {
  if (!userId) return false;
  const customer = await Customer.findOne({ user: userId });
  if (!customer) throw new Error('EPISODE.GET.CUSTOMER_NOT_FOUND');
  const bookshelf = customer.bookshelf.map((episodeId) => episodeId.toString());
  return bookshelf.indexOf(episodeId.toString()) !== -1;
};

const increaseChapter = (episodeA, episodeB) => episodeA.chapter - episodeB.chapter




const decreaseChapter = (episodeA, episodeB) => episodeB.chapter - episodeA.chapter


module.exports = {
  isInBookShelf,
  checkLock,
  increaseChapter,
  decreaseChapter
}