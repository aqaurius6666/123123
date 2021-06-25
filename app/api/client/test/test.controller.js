import express from 'express';
import { deleteKey, getSignedUrl, upload, testfunction } from '../../../services/s3/s3';
import { badRequest } from '../../../utils/response-utils';
import CommonError from '../../library/error';

const api = express.Router();
api.post('/test', async (req, res) => {
    try {
        const {name} = req.body
        const status = await testfunction(`read/${name}/`)
        return res.json(status)
    } catch (err) {
        console.log(err)
    }
})
module.exports = api