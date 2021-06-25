import { SEED_DATA, VERSION } from '../environment';
import { generateCounter } from './counter';
import SystemInformation from '../models/system_information';
import { createDefaultUser } from './users';
import { generateRole } from './roles';
import { generateCustomer } from './customers';
import { generateCreator } from './creator';
import { generateEpisode } from './episode';
import { generateSerie } from './serie';
import { generateEdition } from './editions';
import { getBlockChainMetaData } from './blockchain';

const { hashElement } = require('folder-hash');

export const seed = async () => {
	if (SEED_DATA === 'true') {
		const version = VERSION ?? '1';
		const hashSeedFolder = await hashElement('./app/models');
		const systemInformation = await SystemInformation.findOne({ version });
		if (!systemInformation) {
			await _seed();
			await new SystemInformation({
				version,
				seedHash: hashSeedFolder.hash,
			}).save();
		} else if (systemInformation.seedHash !== hashSeedFolder.hash) {
			await _seed();
			systemInformation.seedHash = hashSeedFolder.hash;
			await systemInformation.save();
		}
	}
};

const _seed = async () => {
	await getBlockChainMetaData();
	await generateCounter();
	await generateRole();
	await generateEdition();
	await generateCustomer();
	await generateCreator();
	await generateEpisode();
	await generateSerie();
	await createDefaultUser();
};