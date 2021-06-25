import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const SeedingSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
    },
    certificates: {
      path: {
        type: String,
        required: true,
      },
      hash: {
        type: String,
        required: true,
      },
    },
    buyInvoice: {
      path: {
        type: String,
        required: true,
      },
      hash: {
        type: String,
        required: true,
      },
    },
    seedingTime: {
      type: Date,
      required: true,
    },
    estimatedPlantingTime: {
      type: Date,
      required: true,
    },
    landLot: {
      type: Schema.Types.ObjectId,
      ref: 'LandLot',
      required: true,
    },
    farmLocation: {
      type: { type: String },
      coordinates: [],
    },
    species: {
      type: Schema.Types.ObjectId,
      ref: 'Specie',
      required: true,
    },
    area: {
      type: Number,
      required: true,
    },
    numberOfSeed: {
      type: Number,
      required: true,
    },
    expectedQuantity: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    porosity: {
      type: Number,
      required: true,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    leader: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    worker: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    seedingImage: {
      path: {
        type: String,
        required: true,
      },
      thumbnail: {
        type: String,
      },
      hash: {
        type: String,
        required: true,
      },
    },
    landLotImage: {
      path: {
        type: String,
        required: true,
      },
      thumbnail: {
        type: String,
      },
      hash: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true },
);
SeedingSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('seeding');
    this.code = nextSeq;
  }
});
const Seeding = mongoose.model('Seeding', SeedingSchema);

module.exports = Seeding;
