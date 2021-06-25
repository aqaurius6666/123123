import { getCSVFiles, getContentCSVFiles, cleanField } from './scanDataFile';
import Serie from '../models/serie';

const Promise = require('bluebird');

export const generateSerie = async () => {
  try {
    const DataSchema = Serie;
    const generateNumber = await DataSchema.countDocuments();

    if (generateNumber > 0) return;

    const dataFile = await getCSVFiles('series');

    const { header, content } = await getContentCSVFiles(dataFile[0], ';');
    await Promise.map(
      content,
      async (line) => {
        const field = cleanField(line.split(';'));
        const episodes = JSON.parse(`${field[header.indexOf('episodes')].replaceAll('\'', '"')}`)
        const checkDataExits = await DataSchema.findOne({
          _id: field[header.indexOf('_id')],
          episodes: episodes,
          createdBy: field[header.indexOf('createdBy')],
          thumbnail: field[header.indexOf('thumbnail')],
          name: field[header.indexOf('name')],
          header: field[header.indexOf('header')],
          summary: field[header.indexOf('summary')],
          category: field[header.indexOf('category')],
          isPublishing: true,
        });

        if (!checkDataExits) {
          const data = new DataSchema({
            _id: field[header.indexOf('_id')],
            episodes: episodes,
            createdBy: field[header.indexOf('createdBy')],
            thumbnail: field[header.indexOf('thumbnail')],
            name: field[header.indexOf('name')],
            header: field[header.indexOf('header')],
            summary: field[header.indexOf('summary')],
            category: field[header.indexOf('category')],
            isPublishing: true,
          });
          await data.save();
        }
      },
      { concurrency: 10 }
    );

    console.log('Seed Serie Success');
  } catch (err) {
    throw new Error(err.message);
  }
};
