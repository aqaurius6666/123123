import { getNextSequence } from '../api/library/getNextCounter';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const PlantingSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    estimatedPlantingTime: {
      type: Date,
      required: true,
    },
    estimatedHarvestTime: {
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
    numberOfPlants: {
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
    imageAfter: {
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
    imageBefore: {
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
  {
    timestamps: true,
  },
);
PlantingSchema.pre('validate', async function () {
  if (!this.code) {
    const nextSeq = await getNextSequence('planting');
    this.code = nextSeq;
  }
});
const Planting = mongoose.model('Planting', PlantingSchema);

module.exports = Planting;
