require('dotenv').config()

const BigNumber = require('bignumber.js')
const TronWeb = require('tronweb')
const { getConfirmedTx } = require('./utils')

async function main() {
  const NODEURI = process.env.NODE_URI || ''
  const EVENTURI = process.env.EVENT_URI || ''
  const ACCOUNT = process.env.ACCOUNT || ''
  const privateKey = process.env.PRIVATE_KEY || ''
  if (!NODEURI || !EVENTURI || !ACCOUNT || !privateKey) {
    throw new Error('please set .env')
  }
  
  let confirmation = process.env.CONFIRMATION || 3
  if (typeof confirmation === 'string') {
    if (!/^[\d]+$/.test(confirmation)) {
      throw new Error('confirmation should be number')
    }
    confirmation = parseInt(confirmation)
  }

  const HttpProvider = TronWeb.providers.HttpProvider
  const fullNode = new HttpProvider(NODEURI)
  const solidityNode = new HttpProvider(NODEURI)
  const eventServer = new HttpProvider(EVENTURI)
  if (process.argv.length < 3) {
    throw new Error('usage: node main.js [txid]')
  }
  const txid = process.argv[2]
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey)
  console.log(`Get transaction: ${txid}`)
  const tx = await getConfirmedTx(tronWeb, txid, confirmation, 3)
  return tx
}

main()
  .then(console.log)
  .catch(console.trace)