import { SumOption } from '../../../library/search';
import ImportOrder from '../../../../models/import_order';
import { searchFunction } from '../../../library/new-search';
import User from '../../../../models/user';

const getAll = async (args = {}, user) => {
  const userAgency = await User.findOne({ _id: user });
  if (!userAgency) throw new Error('FIND.ERROR.');
  const defaultSortField = 'createdAt';

  const searchModel = {
    exportAgency: { _id: 'objectId' },
    exportedAt: 'date-time',
    shipping: { shipper: { _id: 'objectId' }, gsin: 'string' },
    exportOrder: { _id: 'objectId', importAgency: { _id: 'objectId' } },
    pickUpTime: 'date-time',
    status: 'string',
    importedAt: 'date-time',
    importedBy: { _id: 'objectId' },
    createdAt: 'date-time',
    _id: 'objectId-contain',
  };

  const poppulateObj = {
    exportAgency: { __from: 'agencies', __select: ['name', 'address', 'phone', 'code'] },
    products: { __from: 'qrcodes', __isArray: true },
    scannedProducts: { __from: 'qrcodes', __isArray: true },
    exportOrder: {
      __from: 'exportorders',
      importAgency: {
        __from: 'agencies',
      },
    },
    importedBy: { __from: 'users', __select: ['username', 'fullName', 'phone', 'code'] },
  };
  console.log({ agency: userAgency.agency });
  // 601c9b82ffdc0500408b2f37
  // 601c9b82ffdc0500408b2f34
  const vArgs = {
    ...args,
    'exportOrder.importAgency._id': userAgency.agency,
  };

  console.log({ vArgs });
  const {
    pop, sortOption, skipOptions, page, limit,
  } = searchFunction(vArgs, defaultSortField, searchModel, poppulateObj);

  console.log(pop);
  const query = await ImportOrder
    .aggregate([...pop, { $sort: sortOption }, { $skip: skipOptions }, { $limit: limit }]);
  const total = await ImportOrder.aggregate([...pop, SumOption]);
  return {
    data: query,
    paging: { page, limit, total: total.length === 0 ? 0 : total[0].n },
  };
};
module.exports = {
  getAll,
};
