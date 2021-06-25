import Creator from '../models/creator';

import { cleanField, getContentCSVFiles, getCSVFiles, parseList } from './scanDataFile';

const Promise = require('bluebird');

export const generateCreator = async () => {
  try {
    const DataSchema = Creator;
    const generateNumber = await DataSchema.countDocuments();

    if (generateNumber > 0) return;

    const dataFile = await getCSVFiles('creators');

    const { header, content } = await getContentCSVFiles(dataFile[0], ';');
    await Promise.map(
      content,
      async (line) => {
        const field = cleanField(line.split(';'));

				const series = parseList(field[header.indexOf('series')])

        const checkDataExits = await DataSchema.findOne({
          _id: field[header.indexOf('_id')],
          user: field[header.indexOf('user')],
          series,
        });

        if (!checkDataExits) {
          const data = new DataSchema({
						_id: field[header.indexOf('_id')],
						user: field[header.indexOf('user')],
						series,
					});
	
          await data.save();
        }
      },
      { concurrency: 10 }
    );

    console.log('Seed Creator Success');
  } catch (err) {
    throw new Error(err.message);
  }
};