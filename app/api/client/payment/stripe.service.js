const axios = require('axios');
const Stripe = require('stripe');
const qs = require('qs');
const Role = require('../../../models/role');
const Customer = require('../../../models/customer');

const { STRIPE_TOKEN, STRIPE_API_KEY } = require('../../../environment');

const stripe = Stripe(STRIPE_API_KEY);

const createStripeAccount = async ({ email, metadata }) => {
  const data = qs.stringify({
    email,
    metadata,
  });

  const config = {
    method: 'POST',
    url: 'https://api.stripe.com/v1/customers',
    headers: {
      Authorization: `Basic ${STRIPE_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  };

  const response = await axios(config).catch((err) =>
    JSON.stringify(err.response)
  );

  return response.data;
};

const setupPaymentIntent = async ({ userInfo }) => {
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

  const { stripeAccount } = customer;

  if (!stripeAccount) {
    throw new Error('CUSTOMER.PAYMENT_INVALID');
  }

  return stripe.setupIntents.create({
    payment_method_types: ['card'],
    customer: stripeAccount,
    usage: 'on_session',
  });
};

const getCustomerPaymentMethod = async ({ customerID }) => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerID,
    type: 'card',
  });

  return paymentMethods.data;
};

const deduplicatePaymentMethods = async ({
  customerID: customer,
  type = 'card',
}) => {
  const fingerprints = [];

  const { data: paymentMethods } = await stripe.paymentMethods.list({
    customer,
    type,
  });

  const sortedPaymentMethods = paymentMethods
    ? paymentMethods.sort((a, b) => a.created - b.created)
    : [];

  for (const method of sortedPaymentMethods) {
    if (fingerprints.includes(method[type].fingerprint)) {
      await stripe.paymentMethods.detach(method.id);

      console.log(`Detached duplicate payment method ${method.id}.`);
    } else {
      fingerprints.push(method[type].fingerprint);
    }
  }
};

const detachPaymentMethod = async ({ paymentMethod }) => {
  return stripe.paymentMethods.detach(paymentMethod);
};

const sleep = async (time) => new Promise((res, rej) => {
  console.log(`Stimulate stripe payment take ${time}ms`)
  setTimeout(res, time)
})
const checkout = async ({ amount, currency = 'USD', customer, payment, cart }) => {
  return stripe.paymentIntents.create({
    amount,
    currency,
    customer,
    payment_method: payment,
    off_session: true,
    confirm: true,
    metadata: {
      params: JSON.stringify({
        amount,
        currency,
        customer,
        payment,
        cart
      }),
    },
  });
};

module.exports = {
  createStripeAccount,
  setupPaymentIntent,
  getCustomerPaymentMethod,
  detachPaymentMethod,
  deduplicatePaymentMethods,
  checkout,
};
