const mongoose = require('mongoose');

const { Schema } = mongoose;

const QRCodeSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activeBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    activeAt: {
      type: Date,
    },
    scanAt: {
      type: Date,
    },
    scanBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    quantity: {
      type: Number,
    },
    scanLocation: {
      type: { type: String },
      coordinates: [],
    },
    type: {
      type: String, // 1: product, 2: packing 3: lo
      required: true,
      enum: ['1', '2', '3'],
    },
    packedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    packedLocation: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
    },
    packedDate: {
      type: Date,
    },
    isPacked: {
      type: Boolean,
    },
    packing: {
      type: Schema.Types.ObjectId,
      ref: 'Packing',
    },
    enterprise: {
      name: {
        type: String,
        required: true,
      },
      taxId: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      presentedBy: {
        type: String,
        required: true,
      },
      gln: {
        type: String,
        required: true,
      },
    },
    sampleImage: {
      path: {
        type: String,
      },
      hash: {
        type: String,
      },
      takenBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      takenTime: {
        type: Date,
      },
      location: {
        type: { type: String },
        coordinates: [],
      },
    },
    species: {
      type: Schema.Types.ObjectId,
      ref: 'Specie',
    },
    productPlan: {
      type: Schema.Types.ObjectId,
      ref: 'ProductPlan',
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: 'QRCode',
      },
    ],
    distributedStatus: {
      type: String, // 1: moi tao, 2: phan phoi 3: su dung
      enum: ['1', '2', '3'],
    },
    distributedAt: {
      type: Date,
    },
    usedAt: {
      type: Date,
    },
    distributedLocation: {
      type: String,
    },
    retailInfo: {
      isSold: {
        type: Boolean,
        default: false,
      },
      soldDate: Date,
      soldAt: {
        type: Schema.Types.ObjectId,
        ref: 'Agency',
      },
      soldBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      buyer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
      },
    },
    shippingHistory: [{
      from: {
        agency: {
          type: Schema.Types.ObjectId,
          ref: 'Agency',
        },
        time: {
          type: Date,
        },
      },
      to: {
        agency: {
          type: Schema.Types.ObjectId,
          ref: 'Agency',
        },
        time: {
          type: Date,
        },
      },
      createdAt: {
        type: Date,
      },
    }],
  },
  { timestamps: true },
);

const QRCode = mongoose.model('QRCode', QRCodeSchema);
module.exports = QRCode;
