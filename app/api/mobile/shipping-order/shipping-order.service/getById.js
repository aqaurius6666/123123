import ShippingOrder from '../../../../models/shipping_order';

const getById = async (args = {}, user) => {
  const validateArgs = (arg = {}) => {
    const { orderId } = arg;
    if (!orderId) throw new Error('FIND.ERROR.SHIPPING_ORDER.MISSING_ORDER_ID');
    return orderId;
  };
  const vOrderId = validateArgs(args);
  try {
    const exportOrderInfo = await ShippingOrder.findOne({ _id: vOrderId, shipper: user }).populate([
      {
        path: 'importAgency',
        select: 'name phone address shippingAddress',
      },
      {
        path: 'exportAgency',
        select: 'name phone address shippingAddress',
      },
      {
        path: 'shipper',
        select: 'fullName phone agency code',
      },
      {
        path: 'products',
        populate: ['species', 'packing'],
      },
    ]);
    if (exportOrderInfo) {
      return exportOrderInfo;
    } throw new Error('FIND.ERROR.SHIPPING_ORDER.SHIPPING_ORDER_NOT_FOUND');
  } catch (e) {
    throw new Error(e.message);
  }
};
module.exports = {
  getById,
};
