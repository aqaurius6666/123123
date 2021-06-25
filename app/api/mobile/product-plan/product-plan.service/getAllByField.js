import PlanRoleMapping from '../../../../models/plan_role_mapping';
import {
  searchFunction,
} from '../../../library/new-search';
import { SumOption } from '../../../library/search';

const getAllByField = async (args = {}, query, user) => {
  try {
    const validFields = ['harvesting', 'preliminaryTreatment', 'cleaning', 'packing', 'preservation'];
    const validateArgs = (arg = {}) => {
      const { productPlanField } = arg;
      if (!productPlanField) throw new Error('VALIDATE.ERROR.PRODUCT_PLAN.MISSING_FIELD');
      if (!validFields.includes(productPlanField)) {
        throw new Error('VALIDATE.ERROR.PRODUCT_PLAN.INVALID_FIELD');
      }
      return arg;
    };
    const processNameMapping = [
      { process: '2', name: 'harvesting', poppulate: { harvesting: { __from: 'productplanharvestings' } } },
      {
        process: '3',
        name: 'preliminaryTreatment',
        poppulate: { preliminaryTreatment: { __from: 'productplanpreliminarytreatments' } },
      },
      { process: '4', name: 'cleaning', poppulate: { cleaning: { __from: 'productplancleanings' } } },
      { process: '5', name: 'packing', poppulate: { packing: { __from: 'productplanpackings', packing: { __from: 'packings' } } } },
      { process: '6', name: 'preservation', poppulate: { preservation: { __from: 'productplanpreserves' } } },
    ];
    const { productPlanField } = await validateArgs(args);
    const currentProcess = processNameMapping.filter((x) => x.name === productPlanField)[0];

    const searchModel = {
      isDone: 'boolean',
      process: 'number',
      productPlan: {
        isMaster: 'boolean',
        process: 'string-array',
        harvesting: {
          _id: 'objectId',
          startTime: 'date-time',
          endTime: 'date-time',
        },
      },
      user: {
        _id: 'objectId',
        fullName: 'string',
      },
    };
    const poppulateObj = {
      productPlan: {
        __from: 'productplans',
        planting: {
          __from: 'plantings',
          species: { __from: 'species' },
          landLot: { __from: 'landlots' },
        },
        harvesting: {
          __from: 'productplanharvestings',
        },
        seeding: { __from: 'seedings', species: { __from: 'species' } },
        ...currentProcess.poppulate,
      },
      user: { __from: 'users' },
    };
    const filter = {
      isDone: 'false',
      process: currentProcess.process,
      'productPlan.isMaster': 'true',
      'productPlan.process': currentProcess.process,
      'user._id': user,
      ...query,
    };
    const defaultSortField = 'createdAt';

    const {
      pop, sortOption, skipOptions, page, limit,
    } = searchFunction(filter, defaultSortField, searchModel, poppulateObj);

    const data = await PlanRoleMapping
      .aggregate([...pop, { $sort: sortOption }, { $skip: skipOptions }, { $limit: limit }]);
    const total = await PlanRoleMapping.aggregate([...pop, SumOption]);
    return {
      data,
      paging: { page, limit, total: total.length === 0 ? 0 : total[0].n },
    };
  } catch (e) {
    console.trace();
    throw e;
  }
};
module.exports = {
  getAllByField,
};
