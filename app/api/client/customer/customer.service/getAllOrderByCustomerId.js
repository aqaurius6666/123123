import Customer from '../../../../models/customer';
import CustomerOrder from '../../../../models/customer_order';

import {
  parsePaginationOption,
  SumOption,
} from '../../../library/search';
import { getSearchOption, mergeSearchObjToPopulate, poppulate } from '../../../library/new-search';

export const getAllOrderByCustomerId = async (args) => {
  const validateParams = async (params) => {
    const { customerId } = params;
    if (!customerId) throw new Error('VALIDATE.ERROR.CUSTOMER_ORDER.MISSING_CUSTOMER_ID');
    return params;
  };
  const { customerId } = await validateParams(args.params);
  const customerInfo = await Customer.findOne({ _id: customerId });
  if (customerInfo) {
    const defaultSortField = 'createdAt';
    const searchModel = {
    };
    const poppulateObj = {
      sellAgency: { __from: 'agencies' },
      seller: { __from: 'users' },
    };
    args = args.query;
    const validSearchOption = getSearchOption(args, searchModel);
    // console.log(args, '\n', validSearchOption);
    mergeSearchObjToPopulate(validSearchOption, poppulateObj, searchModel, args);
    // console.log('\n', JSON.stringify(poppulateObj));
    const paginationOption = parsePaginationOption(args);
    const sortOption = { [args.sortBy ? args.sortBy === '' ? defaultSortField : args.sortBy : defaultSortField]: args.sortType === 'asc' ? 1 : -1 };
    // sortOption.sortBy = args.sortBy??'_id';
    const { page, limit } = paginationOption;
    const skipOptions = limit * (page - 1);

    const [pop] = poppulate(poppulateObj);
    const query = await CustomerOrder
      .aggregate([...pop, { $sort: sortOption }, { $skip: skipOptions }, { $limit: limit }])
      .collation({
        locale: 'vi',
        numericOrdering: true,
      });
    const total = await CustomerOrder.aggregate([...pop, SumOption]);
    return {
      data: query,
      paging: { page, limit, total: total.length === 0 ? 0 : total[0].n },
    };
  }
  throw new Error('FIND.ERROR.CUSTOMER_ORDER.CUSTOMER_NOT_FOUND');
};
