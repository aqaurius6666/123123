import { SumOption } from '../../../library/search';
import ShippingOrder from '../../../../models/shipping_order';
import { searchFunction } from '../../../library/new-search';

const getAll = async (args = {}, user) => {
  const defaultSortField = 'createdAt';

  const searchModel = {
    exportAgency: { _id: 'objectId' },
    importAgency: { _id: 'objectId' },
    exportOrder: { _id: 'objectId' },
    status: 'string',
    shipper: { _id: 'objectId' },
    createdAt: 'date-time',
    pickUpTime: 'date-time',
    deliveryTime: 'string',
    _id: 'objectId-contain',
  };
  const poppulateObj = {
    exportAgency: { __from: 'agencies', __select: ['name', 'address', 'phone', 'code'] },
    importAgency: { __from: 'agencies', __select: ['name', 'address', 'phone', 'code'] },
    products: { __from: 'qrcodes', __isArray: true },
    exportOrder: { __from: 'exportorders' },
    shipper: { __from: 'users', __select: ['username', 'fullName', 'phone', 'code'] },
    exportedBy: { __from: 'users', __select: ['username', 'fullName', 'phone', 'code'] },
  };
  const vArgs = {
    ...args,
    'shipper._id': user,
  };
  const {
    pop, sortOption, skipOptions, page, limit,
  } = searchFunction(vArgs, defaultSortField, searchModel, poppulateObj);

  const query = await ShippingOrder
    .aggregate([...pop, { $sort: sortOption }, { $skip: skipOptions }, { $limit: limit }]);
  const total = await ShippingOrder.aggregate([...pop, SumOption]);
  return {
    data: query,
    paging: { page, limit, total: total.length === 0 ? 0 : total[0].n },
  };
};
module.exports = {
  getAll,
};
