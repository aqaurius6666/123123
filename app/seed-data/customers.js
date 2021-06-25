import Customer from '../models/customer';
import User from '../models/user';
import Role from '../models/role';
import {
	cleanField,
	getContentCSVFiles,
	getCSVFiles,
	parseList,
} from './scanDataFile';

const Promise = require('bluebird');

export const generateCustomer = async () => {
	try {
		const DataSchema = Customer;
		const generateNumber = await DataSchema.countDocuments();

		if (generateNumber > 0) return;

		const dataFile = await getCSVFiles('customers');

		const { header, content } = await getContentCSVFiles(dataFile[0], ';');
		await Promise.map(
			content,
			async (line) => {
				const field = cleanField(line.split(';'));

				const carts = parseList(field[header.indexOf('carts')]);
				const bookshelf = parseList(field[header.indexOf('bookshelf')]);
				const paymentMethods = parseList(
					field[header.indexOf('paymentMethods')]
				);
				const checkDataExits = await DataSchema.findOne({
					_id: field[header.indexOf('_id')],
					carts,
					bookshelf,
					paymentMethods,
					user: field[header.indexOf('user')],
					stripeAccount: field[header.indexOf('stripeAccount')],
					displayName: field[header.indexOf('displayName')],
				});

				if (!checkDataExits) {
					const data = new DataSchema({
						_id: field[header.indexOf('_id')],
						carts,
						bookshelf,
						paymentMethods,
						user: field[header.indexOf('user')],
						stripeAccount: field[header.indexOf('stripeAccount')],
						displayName: field[header.indexOf('displayName')],
					});

					await data.save();
				}
			},
			{ concurrency: 10 }
		);

		console.log('Seed Customer Success');
	} catch (err) {
		throw new Error(err.message);
	}
};
