import ImportOrder from '../../../../models/import_order';

const getById = async (args = {}) => {
  const validateArgs = (arg = {}) => {
    const { orderId } = arg;
    if (!orderId) throw new Error('FIND.ERROR.EXPORT_ORDER.MISSING_ORDER_ID');
    return orderId;
  };
  const vOrderId = validateArgs(args);
  try {
    const exportOrderInfo = await ImportOrder.findOne({ _id: vOrderId }).populate([
      {
        path: 'exportAgency',
        select: 'name phone address shippingAddress',
      },
      {
        path: 'shipping.shipper',
        select: 'fullName phone agency code',
      },
      {
        path: 'products',
        populate: ['species', 'packing'],
      },
      {
        path: 'scannedProducts',
        populate: 'species packing',
      },
    ]);
    return exportOrderInfo;
  } catch (e) {
    throw new Error(e.message);
  }
};
module.exports = {
  getById,
};
