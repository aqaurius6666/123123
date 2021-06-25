import { getCSVFiles, getContentCSVFiles, cleanField } from './scanDataFile';
import Episode from '../models/episode';

const Promise = require('bluebird');

export const generateEpisode = async () => {
  try {
    const DataSchema = Episode;
    const generateNumber = await DataSchema.countDocuments();

    if (generateNumber > 0) return;

    const dataFile = await getCSVFiles('episodes');

    const { header, content } = await getContentCSVFiles(dataFile[0]);
    await Promise.map(
      content,
      async (line) => {
        const field = cleanField(line.split(','));
        const checkDataExits = await DataSchema.findOne({
          _id: field[header.indexOf('_id')],
          price: field[header.indexOf('price')],
          currency: field[header.indexOf('currency')],
          thumbnail: field[header.indexOf('thumbnail')],
          serie: field[header.indexOf('serie')],
          pageNumber: field[header.indexOf('pageNumber')],
          key: field[header.indexOf('key')],
          chapter: field[header.indexOf('chapter')],
          amount: 5,
        });

        if (!checkDataExits) {
          const data = new DataSchema({
            _id: field[header.indexOf('_id')],
            price: field[header.indexOf('price')],
            currency: field[header.indexOf('currency')],
            thumbnail: field[header.indexOf('thumbnail')],
            serie: field[header.indexOf('serie')],
            pageNumber: field[header.indexOf('pageNumber')],
            chapter: field[header.indexOf('chapter')],
            name: field[header.indexOf('name')],
            key: field[header.indexOf('key')],
            isPublishing: true,
            amount: 5,
          });
          await data.save();
        }
      },
      { concurrency: 10 }
    );

    console.log('Seed Episode Success');
  } catch (err) {
    throw new Error(err.message);
  }
};
