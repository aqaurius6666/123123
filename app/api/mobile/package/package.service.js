import { parsePaginationOption, SumOption } from '../../library/search';
import QRCode from '../../../models/qrcode';
import User from '../../../models/user';
import { getSearchOption, mergeSearchObjToPopulate, poppulate } from '../../library/new-search';

const getAll = async (args = {}) => {
  const defaultSortField = 'createdAt';
  const searchModel = {
    createdBy: { fullName: 'string' },
    packedBy: { _id: 'objectId' },
    activeBy: { fullName: 'string' },
    createdAt: 'date-time',
    activeAt: 'date-time',
    packedDate: 'date-time',
    type: 'string',
    _id: 'objectId-contain',
  };
  const poppulateObj = {
    createdBy: { __from: 'users' },
    packedBy: { __from: 'users' },
    activeBy: { __from: 'users' },
    packing: { __from: 'packings' },
    packedLocation: { __from: 'agencies' },
    productPlan: {
      __from: 'productplans',
      cleaning: { __from: 'productplancleanings' },
      seeding: {
        __from: 'seedings',
        species: { __from: 'species' },
        manager: { __from: 'users' },
        worker: { __from: 'users', __isArray: true },
        leader: { __from: 'users', __isArray: true },
      },
    },
  };
  const validSearchOption = getSearchOption(args, searchModel);
  console.log(args, '\n', validSearchOption);
  mergeSearchObjToPopulate(validSearchOption, poppulateObj, searchModel, args);
  console.log('\n', JSON.stringify(poppulateObj));
  const paginationOption = parsePaginationOption(args);
  const { page, limit } = paginationOption;
  const skipOptions = limit * (page - 1);

  const sortOption = { [args.sortBy ? args.sortBy === '' ? defaultSortField : args.sortBy : defaultSortField]: args.sortType === 'asc' ? 1 : -1 };
  const [pop] = poppulate(poppulateObj);
  const query = await QRCode.aggregate([...pop, { $sort: sortOption }, { $skip: skipOptions }, { $limit: limit }]);
  const total = await QRCode.aggregate([...pop, SumOption]);
  return {
    data: query,
    paging: { page, limit, total: total.length === 0 ? 0 : total[0].n },
  };
};

const getById = async (args = {}) => {
  const validateArgs = (arg = {}) => {
    const { packageId } = arg;
    if (!packageId) throw new Error('FIND.ERROR.PACKAGE.PACKAGE_ID_NOT_FOUND');
    return packageId;
  };
  const vPackageId = validateArgs(args);
  try {
    const result = await QRCode.findOne({ _id: vPackageId, type: '2' }).populate([
      {
        path: 'children',
        populate: ['species', 'packing'],
      }, {
        path: 'packedLocation',
      }, {
        path: 'packedBy',
        select: 'fullName',
      }, {
        path: 'createdBy',
        select: 'fullName',
      }, {

        path: 'activeBy',
        select: 'fullName',
      },
    ]);
    if (!result) {
      throw new Error('FIND.ERROR.PACKING.PACKING_ID_NOT_FOUND');
    }

    return result;
  } catch (e) {
    throw new Error(e.message);
  }
};

const create = async (body = {}, user) => {
  const validateBody = async (bodyRequest = {}) => {
    const {
      packingQR,
      productQR,
    } = bodyRequest;
    if (!packingQR) throw new Error('VALIDATE.ERROR.PACKAGE.PACKING_QR_NOT_FOUND');
    if (!productQR) throw new Error('VALIDATE.ERROR.PACKAGE.PRODUCT_QR_NOT_FOUND');
    return bodyRequest;
  };
  const {
    packingQR,
    productQR,
  } = await validateBody(body);
  try {
    const packingQRInfo = await QRCode.findOne({
      _id: packingQR,
      type: '2',
      isActive: true,
      isPacked: false,
      'retailInfo.isSold': false,
    });
    if (packingQRInfo) {
      const productQRInfo = await QRCode
        .find({ _id: { $in: productQR }, isActive: true, isPacked: false });
      const validQR = [];
      productQRInfo.forEach((e) => {
        validQR.push(e._id);
      });
      if (productQRInfo.length > 0) {
        const userInfo = await User.findOne({ _id: user });
        if (userInfo.agency) {
          packingQRInfo.children = validQR;
          packingQRInfo.packedBy = user;
          packingQRInfo.packedLocation = userInfo.agency;
          packingQRInfo.packedDate = new Date();
          packingQRInfo.isPacked = true;
          await packingQRInfo.save();
          await QRCode.updateMany({ _id: { $in: validQR } }, { $set: { isPacked: true } });
          return packingQRInfo;
        }
        throw new Error('CREATE.ERROR.PACKAGE.USER_DOESNT_BELONG_TO_ANY_AGENCY');
      } else {
        throw new Error('CREATE.ERROR.PACKAGE.ALL_PRODUCT_QR_ARE_INVALID_OR_NEED_ACTIVE_OR_MAYBE_PACKED');
      }
    } else {
      throw new Error('CREATE.ERROR.PACKAGE.PACKING_QR_NOT_FOUND_OR_MAYBE_PACKED_OR_NEED_ACTIVE');
    }
  } catch (e) {
    throw new Error(e.message);
  }
};

module.exports = {
  getAll,
  getById,
  create,
};
