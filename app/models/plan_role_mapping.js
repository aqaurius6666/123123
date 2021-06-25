const mongoose = require('mongoose');

const { Schema } = mongoose;

const PlanRoleMappingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String, // "worker", "technical", "leader"
      required: true,
    },
    isRecieved: {
      type: Boolean,
      default: false,
      required: true,
    },
    productPlan: {
      type: Schema.Types.ObjectId,
      ref: 'ProductPlan',
      required: true,
    },
    isDone: {
      type: Boolean,
      default: false,
      required: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    notes: {
      type: String,
    },
    process: {
      type: String,
      required: true,
      default: 2, // 1: Chua co gi, 2: thu hoach,
      // 3 : so che, 4: lam sach, 5: dong goi, 6: bao quan
    },
  },
  { timestamps: true },
);
const PlanRoleMapping = mongoose.model('PlanRoleMapping', PlanRoleMappingSchema);

module.exports = PlanRoleMapping;
