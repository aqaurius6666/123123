const mongoose = require('mongoose');

const { Schema } = mongoose;

const productPlanSchema = new Schema(
  {
    code: {
      type: String,
    },
    step: {
      type: String, // 0: chờ tạo, 1 : theo dõi, default là 0
      default: '0',
      required: true,
    },
    isMaster: {
      type: Boolean,
      default: false,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      required: true,
    },
    revisionName: {
      type: String,
    },
    confirmationStatus: {
      type: String, // 0: Chưa có gì, 1: Chờ duyệt, 2: Đã duyệt, 3: Từ chối
      default: '0',
      required: true,
    },
    confirmationDate: {
      type: Date,
    },
    seeding: {
      type: Schema.Types.ObjectId,
      ref: 'Seeding',
      required: true,
    },
    planting: {
      type: Schema.Types.ObjectId,
      ref: 'Planting',
      required: true,
    },
    harvesting: {
      type: Schema.Types.ObjectId,
      ref: 'ProductPlanHarvesting',
      required: true,
    },
    preliminaryTreatment: {
      type: Schema.Types.ObjectId,
      ref: 'ProductPlanPreliminaryTreatment',
      required: true,
    },
    cleaning: {
      type: Schema.Types.ObjectId,
      ref: 'ProductPlanCleaning',
      required: true,
    },
    packing: {
      type: Schema.Types.ObjectId,
      ref: 'ProductPlanPacking',
      required: true,
    },
    preservation: {
      type: Schema.Types.ObjectId,
      ref: 'ProductPlanPreserve',
      required: true,
    },
    history: [{
      createdAt: {
        type: Date,
      },
      name: {
        type: String,
      },
      productPlan: {
        type: Schema.Types.ObjectId,
        ref: 'ProductPlan',
      },
    }],
    parentPlan: {
      type: Schema.Types.ObjectId,
      ref: 'ProductPlan',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    unit: {
      type: Number,
    },
    comments: [{
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: {
        type: Date,
      },
      content: {
        type: String,
        required: true,
        maxlength: 1000,
      },
    }],
    process: {
      type: String, // 1: Chua co gi, 2: thu hoach, 3 : so che, 4: lam sach, 5: dong goi, 6: bao quan
      required: true,
    },
  },
  { timestamps: true },
);
const ProductPlan = mongoose.model('ProductPlan', productPlanSchema);

module.exports = ProductPlan;
