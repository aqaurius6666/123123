import Customer from '../../../../models/customer';
import {
  parsePaginationOption,
  SumOption,
} from '../../../library/search';
import { getSearchOption, mergeSearchObjToPopulate, poppulate } from '../../../library/new-search';

export const getAll = async (args) => {
  const defaultSortField = 'createdAt';
  const searchModel = {
    username: 'string',
    fullName: 'string'
  };
  const poppulateObj = {
  };
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
  const query = await Customer
    .aggregate([...pop, { $sort: sortOption }, { $skip: skipOptions }, { $limit: limit }])
    .collation({
      locale: 'vi',
      numericOrdering: true,
    });
  const total = await Customer.aggregate([...pop, SumOption]);
  return {
    data: query,
    paging: { page, limit, total: total.length === 0 ? 0 : total[0].n },
  };
};
