const p2p = require('pdf2pic');
const PDFParser = require('pdf2json');
const parallelLimit = require('run-parallel-limit');
const path = require('path');
const uuid = require('uuid');
const { streamToBuffer } = require('./file-utils');
const BBPromise = require('bluebird');
const events = require('events');

const getPageSize = (buffer) =>
  new Promise((res, rej) => {
    const pdfParser = new PDFParser();
    pdfParser.parseBuffer(buffer);
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      const width = pdfData.formImage.Width * 25;
      const height = pdfData.formImage.Pages[0].Height * 25;
      const pageNumber = pdfData.formImage.Pages.length;
      res({ width, height, pageNumber });
    });
  });

const splitEvent = async (req, file, cb) => {
  const event = new events.EventEmitter();

  const folder = path.basename(
    file.originalname,
    path.extname(file.originalname)
  );
  console.log('load buffer ', folder);
  const buffer = await streamToBuffer(file.stream);
  const { pageNumber } = await getPageSize(buffer);
  const array = Array.from(Array(pageNumber + 1).keys()).slice(1);
  const opts = {
    width: 816,
    height: 1056,
  };
  const prefix = `read/${uuid.v4()}_${folder}`;
  req.prefix = prefix;
  req.pageNumber = pageNumber;
  const converter = p2p.fromBuffer(buffer, opts);
  BBPromise.map(
    array,
    async (page) => {
      const image = await converter(page, true);
      const data = {
        key: `${prefix}/${page}.png`,
        body: Buffer.from(image.base64, 'base64'),
      };
      event.emit('data', data);
    },
    { concurrency: 5 }
  )
    .then(() => {
      event.emit('done', pageNumber);
    })
    .catch((err) => {
      event.emit('error', err);
    });
  cb(null, event);
};

const createSpliter = async (req, file, cb) => {
  try {
    const folder = path.basename(
      file.originalname,
      path.extname(file.originalname)
    );
    console.log('load buffer ', folder);
    const buffer = await streamToBuffer(file.stream);
    const { pageNumber } = await getPageSize(buffer);
    // if (pageNumber > 100) return cb(new Error("Too many pages!!"))
    const array = Array.from(Array(pageNumber + 1).keys()).slice(1);
    const opts = {
      width: 816,
      height: 1056,
    };
    const prefix = `read/${uuid.v4()}_${folder}`;
    req.prefix = prefix;
    req.pageNumber = pageNumber;
    const converter = p2p.fromBuffer(buffer, opts);
    const tasks = array.map((page) => {
      const func = async (callback) => {
        const image = await converter(page, true);
        const imageBuffer = Buffer.from(image.base64, 'base64');
        const key = `${prefix}/${page}.png`;
        callback(null, {
          key,
          body: imageBuffer,
        });
      };
      return func;
    });

    parallelLimit(tasks, 5, (err, data) => {
      if (err) return cb(err);
      return cb(null, data);
    });
  } catch (err) {
    console.log(err);
    cb(err);
  }
};

module.exports = {
  createSpliter,
  splitEvent,
};
