const { ethers } = require('ethers')
const fs = require('fs')

const { INFURA_ID, CONTRACT_ADDRESS, INFURA_SECRET, MNEMONIC } = process.env
const options = {
  INFURA_ID,
  INFURA_SECRET,
}

const provider = ethers.providers.getDefaultProvider(
  'https://testnet.tomochain.com/',
)
// const provider = new ethers.providers.InfuraProvider('rinkeby', options)

const abi = JSON.parse(fs.readFileSync('./app/services/blockchain/WibuToken.json'))
console.log(abi.abi)
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi)

const formatEther = (balance) => {
  return ethers.utils.formatEther(balance)
}

const formatBytes32String = (string) => {
  return ethers.utils.formatBytes32String(string)
}

const getWalletFromPrivateKey = (privateKey) => {
  return ethers.Wallet(privateKey)
}

const getWalletFromMnemonic = (mnemonic) => {
  return ethers.Wallet.fromMnemonic(mnemonic)
}

const getWalletRandom = () => {
  return ethers.Wallet.createRandom()
}

const balanceOf = async (sender, address, tokenId) => {
  contract.connect(sender)
  const result = await contract['balanceOf(address,uint256)'](address, tokenId)
  return formatEther(result)
}

const balanceOfBatch = async (sender, addressArray, tokenIdArray) => {
  contract.connect(sender)
  const result = await contract['balanceOfBatch(address[],uint256[])'](addressArray, tokenIdArray)
  return result.map(i => formatEther(i))
}

const createEpisode = async(sender, id, uri, maxSupply, initialSupply, data) => {
  contract.connect(sender)
  const result = await contract['createEpisode(string,string,uint256,uint256,bytes)'](id, uri, maxSupply, initialSupply, formatBytes32String(data))
  return result
} 

const mint = async(sender, address, tokenId, amount, data) => {
  contract.connect(sender)
  const result = await contract['mint(address,string,uint256,bytes)'](address, tokenId,amount, formatBytes32String(data))
  return result
} 

const mintBatch = async(sender, address, tokenIdArray, amountArray, data) => {
  contract.connect(sender)
  const result = await contract['mintBatch(address,string[],uint256[],bytes)'](address, tokenIdArray, amountArray, formatBytes32String(data))
  return result
} 
 
const tranfer = async(sender, from, to, id, amount, data) => {
  contract.connect(sender)
  const result = await contract['safeTransferFrom(address,address,uint256,uint256,bytes)'](from, to, id, amount, formatBytes32String(data));
  return result
}

const batchTransfer = async(sender, from, to, idArray, amountArray, data) => {
  contract.connect(sender)
  const result = await contract['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](from, to, idArray, amountArray, formatBytes32String(data));
  return result
}

module.exports(
  getWalletFromPrivateKey,
  getWalletRandom,
  getWalletFromMnemonic,
  balanceOf,
  balanceOfBatch,
  createEpisode,
  mint,
  mintBatch,
  tranfer,
  batchTransfer,
)