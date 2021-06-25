import Promise from 'bluebird';
import _ from 'lodash';
import ImportOrder from '../../../../models/import_order';

const update = async (args = {}, body = {}, user) => {
  const validateBody = async (args = {}) => {
    const {
      status, scannedProducts,
    } = args;
    const validateErrorPre = 'VALIDATE.ERROR.IMPORT_ORDER';
    if (status) {
      const validStatus = ['4'];
      if (!validStatus.includes(status)) throw new Error(`${validateErrorPre}.INVALID_STATUS`);
    }
    if (scannedProducts) {
      if (!(scannedProducts && scannedProducts.length > 0)) throw new Error(`${validateErrorPre}.MISSING_SCANNED_PRODUCT`);
    }
    return args;
  };
  const validateArgs = (arg = {}) => {
    const { orderId } = arg;
    if (!orderId) throw new Error('FIND.ERROR.EXPORT_ORDER.MISSING_ORDER_ID');
    return arg;
  };
  const validateProduct = async (products, scannedProducts) => {
    products = JSON.parse(JSON.stringify(products));
    scannedProducts = JSON.parse(JSON.stringify(scannedProducts));
    products.sort();
    scannedProducts.sort();
    return _.isEqual(products, scannedProducts);
  };
  const {
    status, scannedProducts,
  } = await validateBody(body);
  const { orderId } = await validateArgs(args);
  try {
    const updateErrorPre = 'UPDATE.ERROR.IMPORT_ORDER';
    const currentImportOrder = await ImportOrder.findOne({ _id: orderId });
    if (currentImportOrder) {
      if (status) {
        const isAllProductScanned = await validateProduct(currentImportOrder.products, currentImportOrder.scannedProducts);
        if (isAllProductScanned) {
          currentImportOrder.status = status;
        } else throw new Error(`${updateErrorPre}.ALL_PRODUCT_MUST_BE_SCANNED_BEFORE_IMPORT`);
      }
      if (scannedProducts) {
        // Check nếu đã nhận hàng nhưng chưa nhập kho thì mới cho quét mã
        if (currentImportOrder.status === '3') {
          currentImportOrder.scannedProducts = scannedProducts;
        }
      }
      const savedImportOrder = await currentImportOrder.save();
      return savedImportOrder;
    } throw new Error(`${updateErrorPre}.IMPORT_ORDER_NOT_FOUND`);
  } catch (e) {
    throw new Error(e.message);
  }
};
module.exports = {
  update,
};
