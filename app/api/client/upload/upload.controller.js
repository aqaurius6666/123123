import express from 'express';
import {
  deleteKey,
  upload,
  getSignedUrl,
  getListByPrefix,
  deleteListByPrefix,
} from '../../../services/s3/s3';
import { CheckAuth } from '../../middlewares/auth.mid';
import { badRequest, success } from '../../../utils/response-utils';
import CommonError from '../../library/error';
import Creator from '../../../models/creator';

const api = express.Router();

api.post('/upload', upload.any(), CheckAuth, async (req, res) => {
  const { isPublic } = req.query;
  const creator = await Creator.findOne({user : req.userInfo._id}).lean()
  if (!creator) throw new Error('UPLOAD.POST.NO_PERMISSION')

  req.isPublic = isPublic || false;
  upload.single('file')(req, res, (err) => {
    if (err) return res.json(badRequest(err.message));

    if (!req.files) return res.json(badRequest('File is required'));

    const { key, location, pageNumber } = req.files[0];
    return res.json(success({ key, location, pageNumber }));
  });
});

api.get('/sign', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.json(badRequest('SIGN.GET.MISSING_KEY'));

    const signedUrl = getSignedUrl(key);
    return res.json({ signedUrl });
  } catch (err) {
    console.log(err);
    return CommonError(req, err, res);
  }
});

api.post('/delete', async (req, res) => {
  try {
    const { prefix, key } = req.body;
    if (prefix === undefined && key === undefined)
      return res.json(badRequest('DELETE.POST.MISSING_KEY'));

    const status = Promise.all([deleteListByPrefix(prefix), deleteKey(key)]);
    return res.json({ status });
  } catch (err) {
    console.log(err);
    return CommonError(req, err, res);
  }
});

api.get('/list', async (req, res) => {
  try {
    const { prefix } = req.query;
    const result = await getListByPrefix(prefix);
    res.json({ result });
  } catch (err) {
    console.log(err);
    return CommonError(req, err, res);
  }
});

module.exports = api;
