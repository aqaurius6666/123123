const Creator = require('../../../models/creator');
const Transaction = require('../../../models/transaction');
const moment = require('moment');
const mongoose = require('mongoose');
const excel = require('exceljs');
const CommonError = require('../../library/error');

const defaultCover =
	'https://nftjapan.s3.ap-southeast-1.amazonaws.com/image/be3bc26a-565e-499b-aa69-967baa1c6fdb-KEY%20VUSUAL%201.png';

const getHomepageCoverImage = async ({ creator }) => {
	const existingCreator = await Creator.findOne({ _id: creator }).lean();

	if (!existingCreator) {
		throw new Error('CREATOR.NOT_FOUND');
	}

	return existingCreator.cover || defaultCover;
};

const setHomepageCoverImage = async ({ userInfo, cover }) => {
	const creator = await Creator.findOne({ user: userInfo._id });

	if (!creator) {
		throw new Error('CREATOR.NOT_FOUND');
	}

	return Creator.findOneAndUpdate(
		{
			user: userInfo._id,
		},
		{
			$set: {
				cover,
			},
		}
	);
};

const resetHomepageCoverImage = async ({ userInfo }) => {
	const creator = await Creator.findOne({ user: userInfo._id });

	if (!creator) {
		throw new Error('CREATOR.NOT_FOUND');
	}

	await Creator.updateOne(
		{
			user: userInfo._id,
		},
		{
			$set: {
				cover: defaultCover,
			},
		}
	);

	return Creator.findOne({ user: userInfo._id });
};

const exportTransaction = async ({ userInfo }) => {
	const creator = await Creator.findOne({ user: userInfo._id });

	if (!creator) {
		throw new Error('CREATOR.NOT_FOUND');
	}

	const _randomInArray = (array) =>
		array[Math.trunc(Math.random() * array.length)];

	const episodeName = [
		'Alexandria Hogan',
		'Ada Malone',
		'Paris Gill',
		'Ishaan Graham',
		'Angelina Evans',
		'Leonardo Fry',
		'Maverick Salas',
		'Sydney Davies',
		'Cooper Miller',
		'Cheyenne Lucas',
		'Dominik Murphy',
		'Jerry Miller',
	];

	const creatorTableData = [
		moment().format('YYYY[/]MM[/]DD'),
		moment().format('YYYY[/]MM[/]DD'),
		mongoose.Types.ObjectId().toString(),
		moment().format('YYYY[/]MM[/]DD, h:mm:ss'),
		Math.trunc(Math.random() * 100 + 100),
		Math.trunc(Math.random() * 20 + 1),
		Math.trunc(Math.random() * 5 + 1),
	];

	const transactionTableData = [...Array(10).keys()].map(() => ({
		time: moment().format('YYYY[/]MM[/]DD, h:mm:ss'),
		buyer:
			_randomInArray(episodeName).replace(/\s/gim, '').toLowerCase() +
			'@gmail.com',
		seriesID: mongoose.Types.ObjectId().toString(),
		seriesName: _randomInArray(episodeName),
		episodeID: mongoose.Types.ObjectId().toString(),
		episodeName: _randomInArray(episodeName),
		episodePrice: Math.trunc(Math.random() * 100 + 100),
		amount: Math.trunc(Math.random() * 10 + 1),
		subTotal: Math.trunc(Math.random() * 10 + 1),
		fee: Math.trunc(Math.random() * 90 + 1),
		gasFee: Math.trunc(Math.random() * 10 + 1),
	}));

	return { creatorTableData, transactionTableData };
};

module.exports = {
	getHomepageCoverImage,
	setHomepageCoverImage,
	resetHomepageCoverImage,
	exportTransaction,
};
