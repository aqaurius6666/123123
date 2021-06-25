import User from '../../../models/user';
import Packing from '../../../models/packing';

const validateUser = async (ids = []) => {
  let existsUser = await User.find({ _id: { $in: ids } }).lean().select('_id');
  existsUser = existsUser.map((u) => u._id.toString());
  return existsUser;
};
const validateInput = async (args) => {
  const payload = args;
  if (payload.technical && payload.technical.length > 0) {
    payload.technical = await validateUser(payload.technical);
    if (payload.technical.length === 0) delete payload.technical;
  }
  if (payload.leader && payload.leader.length > 0) {
    payload.leader = await validateUser(payload.leader);
    if (payload.leader.length === 0) delete payload.leader;
  }
  if (payload.worker && payload.worker.length > 0) {
    payload.worker = await validateUser(payload.worker);
    if (payload.worker.length === 0) delete payload.worker;
  }
  if (payload.quantity) {
    if (payload.quantity < 0) {
      throw new Error('VALIDATE.ERROR.INVALID_QUANTITY');
    }
  }
  if (payload.temperature) {
    if (!(payload.temperature > -101 && payload.temperature < 101)) {
      throw new Error('VALIDATE.ERROR.INVALID_TEMPERATURE');
    }
  }
  if (payload.humidity) {
    if (!(payload.humidity > 0 && payload.humidity < 101)) {
      throw new Error('VALIDATE.ERROR.INVALID_HUMIDITY');
    }
  }
  if (payload.porosity) {
    if (!(payload.porosity > 0 && payload.porosity < 101)) {
      throw new Error('VALIDATE.ERROR.INVALID_POROSITY');
    }
  }
  if (payload.location) {
    if (payload.location.length !== 2) {
      throw new Error('VALIDATE.ERROR.INVALID_LOCATION');
    }
    if (!(payload.location[0] >= -180 && payload.location[0] <= 180)) {
      throw new Error('VALIDATE.ERROR.INVALID_LONGITUDE');
    }
    if (!(payload.location[1] >= -90 && payload.location[1] <= 90)) {
      throw new Error('VALIDATE.ERROR.INVALID_LATITUDE');
    }
  }
  if (payload.estimatedPackingTime) {
    const now = new Date();
    if (new Date(payload.estimatedPackingTime) <= now) {
      throw new Error('VALIDATE.ERROR.INVALID_PACKING_TIME');
    }
  }
  if (payload.startTime) {
    const now = new Date();
    if (new Date(payload.startTime) <= now) {
      throw new Error('VALIDATE.ERROR.START_TIME_MUST_GREATER_THAN_NOW');
    }
  }
  if (payload.endTime) {
    const now = new Date();
    if (new Date(payload.endTime) <= now) {
      throw new Error('VALIDATE.ERROR.END_TIME_MUST_BE_GREATER_THAN_NOW');
    }
  }
  if (payload.startTime && payload.endTime) {
    if (new Date(payload.startTime) > new Date(payload.endTime)) {
      throw new Error('VALIDATE.ERROR.START_TIME_MUST_BEFORE_END_TIME');
    }
  }
  if (payload.estimatedExpireTime) {
    const now = new Date();
    if (new Date(payload.estimatedExpireTime) <= now) {
      throw new Error('VALIDATE.ERROR.INVALID_EXPIRE_TIME');
    }
  }
  if (payload.packing) {
    const validPacking = await Packing.findOne({ _id: payload.packing }).lean().select('_id');
    if (validPacking) {
      payload.packing = validPacking._id;
    } else {
      throw new Error('VALIDATE.ERROR.INVALID_PACKING');
    }
  }
  if (payload.products) {
    if (payload.products.length > 0) {

    }
  }
  return payload;
};
module.exports = {
  validateInput,
};
