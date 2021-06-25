import { getCSVFiles, getContentCSVFiles, cleanField } from './scanDataFile';
import Edition from '../models/edition';
import { BLOCKCHAIN_DATA } from './blockchain';

const Promise = require('bluebird');

export const generateEdition = async () => {
  try {
    const DataSchema = Edition;
    const generateNumber = await DataSchema.countDocuments();

    if (generateNumber > 0) return;

    const dataFile = await getCSVFiles('editions');

    const { header, content } = await getContentCSVFiles(dataFile[0]);
    await Promise.map(
      content,
      async (line) => {
        const field = cleanField(line.split(','));
        const checkDataExits = await DataSchema.findOne({
          episode: field[header.indexOf('episode')],
          status: field[header.indexOf('status')],
          owner: field[header.indexOf('owner')],
          tokenId: field[header.indexOf('tokenId')],
          _id: field[header.indexOf('_id')],
          txHash: BLOCKCHAIN_DATA.txh,
        });

        if (!checkDataExits) {
          const data = new DataSchema({
            episode: field[header.indexOf('episode')],
            status: field[header.indexOf('status')],
            owner: field[header.indexOf('owner')],
            tokenId: field[header.indexOf('tokenId')],
            _id: field[header.indexOf('_id')],
            txHash: BLOCKCHAIN_DATA.txh,
          });
          await data.save();
        }
      },
      { concurrency: 10 }
    );

    console.log('Seed Edition Success');
  } catch (err) {
    throw new Error(err.message);
  }
};
