import User from '../../../models/user';
import Role from '../../../models/role';

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

  if (userInDb) throw new Error('USER.POST.EMAIL_HAS_EXISTED');

  const role = await Role.findOne({ role: 'customer' });

  const user = new User({
    email: username,
    username,
    encryptedPrivateKey,
    publicKey,
    role: role._id,
    fullName: vName,
  });
  return user.save();

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
