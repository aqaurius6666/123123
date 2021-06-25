const axios = require('axios');
const { BLOCKCHAIN_URL } = require('../environment');

const chainxios = axios.create({ baseURL: `${BLOCKCHAIN_URL}` });

const unpublishOnChainVu = async ({ privateKey, episodeId, data }) => {
  return chainxios.post('/unpublish', {
    privateKey,
    episodeId,
    data,
  });
};

const publishOnChainVu = async ({ privateKey, episodeId, amount, data }) => {
  return chainxios.post('/publish', {
    privateKey,
    episodeId,
    amount,
    data,
  });
};

const mint = async ({ privateKey, episodeId, isFree, amount, uri, data }) => {
  return chainxios.post('/mint', {
    privateKey,
    episodeId,
    isFree,
    amount,
    uri,
    data,
  });
};

const mintFree = async ({ episodeId, privateKey, to, data }) => {
  return chainxios.post('/get-free', {
    privateKey,
    episodeId,
    to,
    data,
  });
};

const transferBatch = async ({ privateKey, from, to, id, amount, data }) => {
  return chainxios.post('/transfer-batch', {
    privateKey,
    from,
    to,
    id,
    amount,
    data,
  });
};

const ping = async () => {
  return chainxios.get('/')
}
module.exports = {
  chainxios,
  publishOnChainVu,
  unpublishOnChainVu,
  mint,
  mintFree,
  transferBatch,
  ping
};
