import User from '../../../models/user';
import Customer from '../../../models/customer';
import { chainxios } from '../../../utils/blockchain-utils';
import Role from '../../../models/role';
import { Queue } from '../../../models/blockchain_queue';
import StripeService from '../../client/payment/stripe.service';

const validateName = ({ displayName }) => {
  console.log({ displayName });
  let vName = displayName.replace(/\s+/g, ' ').trim();
  if (!vName || vName === '') throw new Error('USER.POST.INVALID_USERNAME');
  return vName;
};
const createUser = async ({
  displayName,
  username,
  encryptedPrivateKey,
  publicKey,
}) => {
  const vName = validateName({ displayName });
  const userInDb = await User.findOne({ username });
  const customerInDB = await Customer.findOne({ displayName: vName });
  if (userInDb) throw new Error('USER.POST.EMAIL_HAS_EXISTED');
  if (customerInDB) throw new Error('USER.POST.USERNAME_HAS_EXISTED');

  const response = await chainxios.post('/wallet');
  if (!response) throw new Error('USER.POST.BLOCKCHAIN_CANT_REACHED');
  const role = await Role.findOne({ role: 'customer' });

  const user = new User({
    email: username,
    username,
    encryptedPrivateKey,
    publicKey,
    walletKey: response.data.data.privateKey,
    walletAddress: response.data.data.address,
    role: role._id,
    fullName: vName,
  });
  const sUser = await user.save();

  const metadata = {
    username: sUser.email,
    fullName: sUser.fullName,
    email: sUser.username,
    publicKey: sUser.walletAddress,
    encryptedPrivateKey: sUser.encryptedPrivateKey,
  };

  const stripeAccount = await StripeService.createStripeAccount({
    email: sUser.username,
    metadata,
  });
  const customer = new Customer({
    user: sUser._id,
    displayName: user.fullName,
    stripeAccount: stripeAccount.id,
  });
  await customer.save();

  return sUser;
};

const getQueueStatus = async ({ userId }) => {
  const queues = await Queue.find({ caller: userId }).populate('tasks').lean();
  const res = queues.map(q => {
    return {
      _id : q._id,
      status : q.status,
      name: q.tasks[0].name
    }
  })
  await Queue.deleteMany({caller : userId, status : 'done'})
  return res;
};

const getUserStatus = async ({ username }) => {
  const user = await User.findOne({
    username,
  });

  if (!user) return false;
  return user.isActive;
};

module.exports = {
  createUser,
  getUserStatus,
  getQueueStatus,
};
