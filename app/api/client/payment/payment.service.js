const axios = require('axios');
const Stripe = require('stripe');
const qs = require('qs');
const Role = require('../../../models/role');
const User = require('../../../models/user');
const Episode = require('../../../models/episode');
const Edition = require('../../../models/edition');
const Customer = require('../../../models/customer');
const Creator = require('../../../models/creator');
const PaymentMethod = require('../../../models/payment_method');
const { TaskQueue, Queue } = require('../../../models/blockchain_queue');
const { transferBatch } = require('../../../utils/blockchain-utils');
const {
  getCustomerPaymentMethod,
  deduplicatePaymentMethods,
  detachPaymentMethod,
  checkout,
} = require('./stripe.service');
const { hookPromise } = require('../../library/customPromise');
const { isValidString } = require('../../../utils/validate-utils');
const Cart = require('../../../models/cart');
const PaymentQueue = require('../../../models/payment_queue');

const addPayment = async ({
  userInfo,
  paymentMethodInfo,
  nameOnCard,
  futureUsage = true,
}) => {
  if (!nameOnCard) {
    throw new Error('CARD.NAME_ON_CARD_INVALID');
  }

  if (!userInfo.role) {
    throw new Error('USER.ROLE_NOT_FOUND');
  }

  const currentRole = await Role.findOne({ _id: userInfo.role });

  if (!currentRole || !currentRole.role || currentRole.role !== 'customer') {
    throw new Error('USER.NOT_CUSTOMER');
  }

  const customer = await Customer.findOne({ user: userInfo._id });

  if (!customer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  if (
    !paymentMethodInfo ||
    !paymentMethodInfo.payment_method ||
    paymentMethodInfo.status !== 'succeeded'
  ) {
    throw new Error('PAYMENT.SET_UP_FAILED');
  }

  const paymentMethods = await getCustomerPaymentMethod({
    customerID: customer.stripeAccount,
  });

  const paymentMethodsFingerprint = paymentMethods
    .filter((method) => isValidString(method.card.fingerprint))
    .map((method) => method.card.fingerprint);

  if (
    paymentMethodsFingerprint.length !== new Set(paymentMethodsFingerprint).size
  ) {
    await deduplicatePaymentMethods({ customerID: customer.stripeAccount });

    throw new Error('PAYMENT.EXISTED');
  }

  const existingPaymentMethod = await PaymentMethod.findOne({
    'card.payment_method': paymentMethodInfo.payment_method,
  });

  if (existingPaymentMethod) {
    throw new Error('PAYMENT.EXISTED');
  }

  const newPaymentMethod = new PaymentMethod({
    nameOnCard: nameOnCard.toUpperCase(),
    card: paymentMethodInfo,
    user: customer._id,
    futureUsage,
  });

  const savedPaymentMethod = await newPaymentMethod.save();

  const { nModified, ok } = await Customer.updateOne(
    {
      _id: customer._id,
    },
    {
      $push: { paymentMethods: savedPaymentMethod._id },
    }
  );

  if (nModified !== 1 || ok !== 1) {
    throw new Error('PAYMENT.ADD_FAILED');
  }

  return savedPaymentMethod;
};

const getAllPayment = async ({ userInfo }) => {
  const customer = await Customer.findOne({ user: userInfo._id });

  if (!customer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  const { stripeAccount } = customer;

  if (!stripeAccount) {
    throw new Error('CUSTOMER.PAYMENT_NOT_FOUND');
  }

  return getCustomerPaymentMethod({
    customerID: stripeAccount,
  });
};

const deletePayment = async ({ userInfo, paymentMethod: paymentMethodID }) => {
  const customer = await Customer.findOne({ user: userInfo._id });

  if (!customer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  const { stripeAccount } = customer;

  if (!stripeAccount) {
    throw new Error('CUSTOMER.PAYMENT_NOT_FOUND');
  }

  const paymentMethod = await PaymentMethod.findOne({
    'card.payment_method': paymentMethodID,
  });

  if (!paymentMethod) {
    throw new Error('PAYMENT.NOT_FOUND');
  }

  const { nModified, ok } = await Customer.updateOne(
    {
      _id: customer._id,
    },
    {
      $pull: {
        paymentMethods: paymentMethod._id,
      },
    }
  );

  if (nModified !== 1 || ok !== 1) {
    throw new Error('PAYMENT.DELETE_FAILED');
  }

  await PaymentMethod.deleteOne({
    _id: paymentMethod._id,
  });

  return detachPaymentMethod({ paymentMethod: paymentMethodID });
};

const _simulateLongCheckout = async ({
  amount,
  currency,
  customer,
  payment,
  metadata,
}) => {
  const delayTime = Math.random() > 0.5 ? 40 * 1000 : 1000;

  await new Promise((resolve) => setTimeout(resolve, delayTime));

  return checkout({
    amount,
    currency,
    customer,
    payment,
    metadata,
  });
};

const validateCartList = async ({ cartList }) => {
  return Promise.all(
    cartList.map(async ({ episode: episodeId, amount }) => {
      if (amount === 0) return null
      const episode = await Episode.findById(episodeId)
        .populate('serie')
        .lean();
      if (!episode) throw new Error('PAYMENT.POST.EPISODE_NOT_FOUND');

      const creator = await Creator.findOne({
        _id: episode.serie.createdBy,
      }).lean();

      const canBuyed = await Edition.countDocuments({
        episode: episodeId,
        status: 'public',
        owner: creator.user,
      });
      if (amount > canBuyed) throw new Error('PAYMENT.POST.EXCEED_AMOUNT');
      const editions = await Edition.find({
        episode: episodeId,
        status: 'public',
        owner: creator.user,
      })
        .limit(amount)
        .lean();
      return {
        amount,
        unitPrice: episode.price,
        editions,
      };
    })
  ).then(array => array.filter(each => each));
};

const validateArgs = async ({
  cartList,
  currency = 'USD',
  payment,
  userInfo,
}) => {
  const items = await validateCartList({ cartList });
  const totalAmount = items.reduce(
    (acc, curr) => acc + curr.amount * curr.unitPrice,
    0
  );

  if (totalAmount <= 0) {
    throw new Error('PAYMENT.INVALID_AMOUNT');
  }

  const customer = await Customer.findOne({ user: userInfo._id })
    .populate('carts')
    .populate('user')
    .lean();
  if (!customer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  const { stripeAccount } = customer;

  if (!stripeAccount) {
    throw new Error('CUSTOMER.PAYMENT_NOT_FOUND');
  }

  const paymentMethods = await getAllPayment({
    userInfo,
  });

  if (paymentMethods.map((e) => e.id).indexOf(payment) === -1) {
    throw new Error('PAYMENT.INVALID');
  }

  const currentCart = customer.carts.find((e) => e.isShopping === true);

  return {
    items,
    currency,
    payment,
    customer,
    currentCart,
    stripeAccount,
    totalAmount,
  };
};

const handleCheckoutResponse = ({
  res,
  params,
}) => {
  if (res.status === 'pending') return res.status;

  if (res.status === 'succeeded') {
    return onCheckoutSuccess({ params });
  }
  return res.status;
};


const executeBlockChainTask = async ({queueId, time}) => {
  const queue = await Queue.findById(queueId).populate('tasks').lean();
  if (!queue) throw new Errror('QUEUE.QUEUE_NOT_FOUND')
  const transferTask = queue.tasks.find(t => t.name === 'blockchain.transfer')
  const transferParams = JSON.parse(transferTask.params)
  const response = await hookPromise({ p : transferBatch(transferParams), time });
  if (response.status) return response.status 
  return response.data.data;
}
const onCheckoutSuccess = async ({ params }) => {
  // done checkout payment task
  const task = await TaskQueue.findOne({ params, status: 'pending' });
  if (!task) throw new Error('PAYMENT.INTERNAL_ERROR');
  task.status = 'done';
  await task.save();

  // execute blockchain task
  return executeBlockChainTask({queueId : task.queue, time: 1})
};

const getWalletCreator = async (item) => {
  // Only 1 creator for all editions

  const userId = item[0].editions[0].owner;
  const user = await User.findById(userId).lean();
  return { walletKey: user.walletKey, walletAddress: user.walletAddress };
};
const createCheckoutQueue = async ({
  checkoutParams,
  transferParams,
  caller,
}) => {
  const queue = new Queue({ status: 'pending', caller, tasks: [] });
  const sQ = await queue.save();
  const checkoutTask = new TaskQueue({
    status: 'pending',
    name: 'checkout.payment',
    queue: sQ._id,
    params: JSON.stringify(checkoutParams),
  });
  const cT = await checkoutTask.save();

  const transferTask = new TaskQueue({
    status: 'pending',
    name: 'blockchain.transfer',
    queue: sQ._id,
    params: JSON.stringify(transferParams),
  });
  const tT = await transferTask.save();
  return Queue.findOneAndUpdate(
    { _id: sQ._id },
    { $push: { tasks: { $each: [cT._id, tT._id] } } },
    {useFindAndModify : false}
  );
};

const checkoutOrder = async (args) => {
  const {
    items,
    currency,
    payment,
    customer,
    currentCart,
    stripeAccount,
    totalAmount,
  } = await validateArgs(args);

  const walletCreator = await getWalletCreator(items);

  const id = items
    .map((each) => each.editions)
    .reduce((pre, cur) => [...pre, cur])
    .map((e) => Number(e.tokenId));
  const amount = Array(id.length).fill(1);

  const checkoutParams = {
    amount: Math.trunc(totalAmount * 100),
    currency,
    customer: stripeAccount,
    payment,
    cart: currentCart._id
  };
  const transferParams = {
    privateKey: walletCreator.walletKey,
    from: walletCreator.walletAddress,
    to: customer.user.walletAddress,
    id,
    amount,
    data: '',
  };
  const q = await createCheckoutQueue({
    checkoutParams,
    transferParams,
    caller: customer.user,
  });

  const p = await hookPromise({ p :checkout(checkoutParams)});
  return handleCheckoutResponse({
    res: p,
    transferParams,
    params: JSON.stringify(checkoutParams),
  });

};

const getStatus = async ({ userInfo }) => {
  const customer = await Customer.findOne({ user: userInfo._id }).lean();

  if (!customer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  const numberOfPendingPayment = await PaymentQueue.countDocuments({
    status: 'processing',
    user: customer._id,
  });

  return numberOfPendingPayment === 0;
};

module.exports = {
  addPayment,
  deletePayment,
  getAllPayment,
  checkoutOrder,
  getStatus,
  executeBlockChainTask,
};
