import Promise from 'bluebird';
import ExportOrder from '../../../../models/export_order';
import ImportOrder from '../../../../models/import_order';
import ShippingOrder from '../../../../models/shipping_order';
import QRCode from '../../../../models/qrcode';

const update = async (args = {}, body = {}, user) => {
  function compare(a, b) {
    if (a.createdAt < b.createdAt) {
      return -1;
    }
    if (a.createdAt > b.createdAt) {
      return 1;
    }
    return 0;
  }
  const validateBody = async (args = {}) => {
    const {
      status,
    } = args;
    const validateErrorPre = 'VALIDATE.ERROR.SHIPPING_ORDER';
    if (!status) throw new Error(`${validateErrorPre}.MISSING_STATUS`);
    const validStatus = ['2', '3'];
    if (!validStatus.includes(status)) throw new Error(`${validateErrorPre}.INVALID_STATUS`);
    return args;
  };
  const validateArgs = (arg = {}) => {
    const { orderId } = arg;
    if (!orderId) throw new Error('FIND.ERROR.SHIPPING_ORDER.MISSING_ORDER_ID');
    return arg;
  };
  const {
    status,
  } = await validateBody(body);
  const { orderId } = await validateArgs(args);
  try {
    const updateErrorPre = 'UPDATE.ERROR.SHIPPING_ORDER';
    const currentShippingOrder = await ShippingOrder.findOne({ _id: orderId, shipper: user });
    if (currentShippingOrder) {
      // Check status, chưa lấy hàng thì không cho cập nhật đã giao hàng
      let nextValidStatus;
      if (currentShippingOrder.status === '1') {
        nextValidStatus = '2';
      } else if (currentShippingOrder.status === '2') {
        nextValidStatus = '3';
      } else if (currentShippingOrder.status === '3') {
        throw new Error(`${updateErrorPre}.ORDER_IS_SHIPPED`);
      }
      if (status !== nextValidStatus) throw new Error(`${updateErrorPre}.STATUS_IS_NOT_IN_SEQUENCE`);
      if (status === '2') {
        const currentDate = new Date();
        // Vận chuyển bấm nút "đã lấy hàng"
        await ExportOrder.updateOne({ _id: currentShippingOrder.exportOrder }, {
          $set: { status: '3' },
        });
        await ImportOrder.updateOne({ exportOrder: currentShippingOrder.exportOrder }, {
          $set: { status: '2', pickUpTime: currentDate },
        });
        currentShippingOrder.pickUpTime = currentDate;
      } else if (status === '3') {
        // Vận chuyển nhấn nút "đã giao hàng"
        // Update thời gian giao hàng cho toàn bộ các mã QR
        const shippedDate = new Date();
        const qrCodeInfo = await QRCode.find({ _id: { $in: currentShippingOrder.products } });
        await Promise.each(qrCodeInfo, async (qr) => {
          const { shippingHistory } = qr;
          shippingHistory.sort(compare);
          shippingHistory[shippingHistory.length - 1].to.time = shippedDate;
          qr.shippingHistory = shippingHistory;
          await qr.save();
        });
        currentShippingOrder.deliveryTime = shippedDate;
        await ImportOrder.updateOne({ exportOrder: currentShippingOrder.exportOrder }, {
          $set: { status: '3', deliveryTime: shippedDate },
        });
      }
      currentShippingOrder.status = status;
      const savedShippingOrder = await currentShippingOrder.save();
      return savedShippingOrder;
    } throw new Error(`${updateErrorPre}.SHIPPING_ORDER_NOT_FOUND`);
  } catch (e) {
    throw new Error(e.message);
  }
};
module.exports = {
  update,
};
