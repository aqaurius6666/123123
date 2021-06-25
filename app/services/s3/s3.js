const AWS = require('aws-sdk');
const {
  AWS_SECRET_ACCESS_KEY,
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_NAME,
  IMAGE,
  WATCH,
  READ,
  IMAGE_SIZE,
  READ_SIZE,
  WATCH_SIZE
} = require('../../environment');
const fs = require('fs');
const uuid = require('uuid');
const multer = require('multer');
const multerS3 = require('../../utils/multer-s3-transform');
const path = require('path');
const { createSpliter, splitEvent } = require('../../utils/pdf2pic');
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: 'ap-southeast-1',
});

const extension_allowed = {
  image: IMAGE,
  watch: WATCH,
  read: READ,
  all: [...IMAGE, ...WATCH, ...READ],
};
const size_allowed = {
  image: IMAGE_SIZE,
  watch: WATCH_SIZE,
  read: READ_SIZE,
};

const s3 = new AWS.S3();

const createBucket = () =>
  new Promise((res, rej) => {
    const params = {
      Bucket: AWS_BUCKET_NAME,
    };
    s3.createBucket(params, (err, data) => {
      if (err) rej(err);
      res(data);
    });
  });

const fileFilter = (req, file, cb) => {
  try {
    const extName = path.extname(file.originalname);
    if (extension_allowed.all.indexOf(extName) !== -1) return cb(null, true);

    throw new Error(
      `Invalid file type only ${extension_allowed.all.join(' ')} is allowed!`
    );
  } catch (err) {
    return cb(err, false);
  }
};
const createParamsFromFile = (key, filePath = null) => {
  if (filePath) {
    return {
      Bucket: AWS_BUCKET_NAME,
      Body: fs.createReadStream(filePath),
      Key: key,
    };
  }
  return {
    Bucket: AWS_BUCKET_NAME,
    Key: key,
  };
};

const uploadBase64 = (key, data) =>
  new Promise((res, rej) => {
    console.log('function');
    const buf = Buffer.from(data, 'base64');
    const params = {
      Key: key,
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg',
      Bucket: AWS_BUCKET_NAME,
    };
    s3.putObject(params, function (err, data) {
      if (err) {
        console.log(err);
        rej(`Error: ${key}`);
      }
      res('successfully uploaded the image!');
    });
  });

const upload = multer({
  fileFilter,
  storage: multerS3({
    s3,
    acl: function (req, file, cb) {
      if (req.isPublic) {
        return cb(null, 'public-read');
      }
      return cb(null, null);
    },

    shouldSplit: function (req, file, cb) {
      const extName = path.extname(file.originalname);
      if (extName === '.pdf') return cb(null, true);
      cb(null, false);
    },
    spliter: (req, file, cb) => createSpliter(req, file, cb),
    splitAndUpload: (req, file, cb) => splitEvent(req, file, cb),
    bucket: AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: 'Copyright by ARIUM' });
    },
    key: function (req, file, cb) {
      try {
        const extName = path.extname(file.originalname);
        let prefix = 'mist';

        if (extension_allowed.read.indexOf(extName) !== -1) {
          prefix = 'read';
        }
        if (extension_allowed.watch.indexOf(extName) !== -1) {
          prefix = 'watch';
        }
        if (extension_allowed.image.indexOf(extName) !== -1) {
          prefix = 'image';
        }
        const key = `${prefix}/${uuid.v4()}-${path.basename(
          file.originalname
        )}`;
        cb(null, key);
      } catch (err) {
        cb(err, false);
      }
    },
  }),
});

const read = async (key) =>
  new Promise((res, rej) => {
    const params = createParamsFromFile(key);
    s3.getObject(params, function (err, data) {
      if (err) {
        rej(err);
      }
      if (data) {
        res(data);
      }
    });
  });

const deleteKey = async (key) =>
  new Promise((res, rej) => {
    if (!key) res(null);
    const params = createParamsFromFile(key);
    s3.deleteObject(params, (err, data) => {
      if (err) rej(err);
      if (data) res(data.Body);
    });
  });

const getSignedUrl = (key) => {
  const extName = path.extname(key);
  var signedUrl = '';
  switch (extName) {
    case '.json':
      signedUrl = s3.getSignedUrl('getObject', {
        Bucket: AWS_BUCKET_NAME,
        Key: key,
        Expires: 60 * 10,
        ResponseContentType: 'application/json',
      });
      break;
    case '.png':
      signedUrl = s3.getSignedUrl('getObject', {
        Bucket: AWS_BUCKET_NAME,
        Key: key,
        Expires: 60 * 10,
        ResponseContentType: 'image/png',
      });
      break;
    case '.jpeg':
      signedUrl = s3.getSignedUrl('getObject', {
        Bucket: AWS_BUCKET_NAME,
        Key: key,
        Expires: 60 * 10,
        ResponseContentType: 'image/jpeg',
      });
      break;

    default:
      signedUrl = s3.getSignedUrl('getObject', {
        Bucket: AWS_BUCKET_NAME,
        Key: key,
        Expires: 60 * 10,
      });
  }
  return signedUrl;
};
const getListByPrefix = async (prefix) =>
  new Promise((res, rej) => {
    const params = {
      Bucket: AWS_BUCKET_NAME,
      Delimiter: '',
      Prefix: prefix[prefix.length] !== '/' ? prefix : `${prefix}/`,
    };
    s3.listObjects(params, async (err, data) => {
      if (err || !data.Contents) rej(err);
      const Contents = data.Contents;
      Promise.all(
        Contents.map((each) => {
          return each.Key;
        })
      ).then(res);
    });
  });

const deleteByListKey = async (list) => {
  const params = {
    Bucket: AWS_BUCKET_NAME,
    Key: null,
  };
  return Promise.all(
    list.map((key) => {
      console.log('Delete', { ...params, Key: key });
      s3.deleteObject(
        { ...params, Key: key },
        (err, data) =>
          new Promise((res, rej) => {
            if (err) rej(err);
            res(data.Body);
          })
      );
    })
  );
};
const deleteListByPrefix = (prefix) =>
  new Promise(async (res, rej) => {
    try {
      if (!prefix) res(null);
      const list = await getListByPrefix(
        prefix[prefix.length] !== '/' ? prefix : `${prefix}/`
      );
      const status = await deleteByListKey(list);
      res(status);
    } catch (err) {
      console.log(err);
      rej(err);
    }
  });
module.exports = {
  read,
  upload,
  getSignedUrl,
  deleteKey,
  uploadBase64,
  deleteListByPrefix,
  getListByPrefix,
  createBucket,
  extension_allowed,
  size_allowed
};
