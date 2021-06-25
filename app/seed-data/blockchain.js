const { BLOCKCHAIN_URL } = require("../environment")
const { chainxios } = require("../utils/blockchain-utils")

let BLOCKCHAIN_DATA = {
  blockchain: 'Tomochain',
  txh: '0x2082ed6ace9ac0142aafd3e56b7be233f66835b405a26729b8de67793461d96c',
  contractAddress: '0x4c02E44265D4e6187Ef1f3A9Ab5b6F4F51A3F133',
}

const getBlockChainMetaData = async () => {
  try {
    // const response = await chainxios.get('/metadata')
    
    console.log(`Connected to Blockchain gateway ${BLOCKCHAIN_URL}`)
    return true
  } catch (err) {
    console.log(err)
    throw err
  }
}

module.exports = {
  getBlockChainMetaData,
  BLOCKCHAIN_DATA
}