const AWS = require('aws-sdk')
const { AWS_SECRET_ACCESS_KEY, AWS_ACCESS_KEY_ID, AWS_BUCKET_NAME } = process.env
const fs = require('fs')
const uuid = require('uuid');
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require('path');
const { SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER } = require('constants');
const s3 = new AWS.S3()

AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: "ap-southeast-1"
});


const fileFilter = (req, file, cb) => {
	switch(file.mimetype.toLowerCase()) {
		case 'image/jpeg':
			cb(null, true);
			break;
		case 'image/png':
			cb(null, true);
			break;
		case 'image/jpg':
			cb(null, true);
			break;
		default:
			cb(null, false);
	}
}

const uploadSerie = multer({
    fileFilter: fileFilter,
    storage: multerS3({
        s3: s3,
        acl: 'public-read',
        bucket: AWS_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: "TESTING_METADATA" });
        },
        key: function (req, file, cb) {
            try {
                // const extName = path.extname(file.originalname)
                let prefix = 'serieImage'
                const key = `${prefix}/${uuid.v4()}-${path.basename(file.originalname)}`
                cb(null, key);
            } catch (err) {
                cb(err, false)
            }
        },
    }),
}).fields([
	{ name: "header", maxCount: 1 },
	{ name: "thumbnail", maxCount: 1 }
   ])

module.exports = {
    uploadSerie,
}