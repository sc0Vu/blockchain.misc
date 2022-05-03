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
  const COINBASE = TronWeb.address.fromPrivateKey(privateKey)
  
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
    throw new Error('usage: node main.js [amount]')
  }
  let amount = process.argv[2]
  if (!/^[\d]+$/.test(amount)) {
    throw new Error('amount should be number')
  }
  amount = new BigNumber(amount)
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey)
  const balance = new BigNumber(await tronWeb.trx.getBalance(COINBASE))
  amount = amount.multipliedBy(new BigNumber(10).pow(6))
  
  if (balance.lte(amount.toString())) {
    throw new Error(`balance is not enough (${balance.toString()})`)
  }
  let transaction = await tronWeb.transactionBuilder.sendTrx(
    ACCOUNT, amount.toString(), COINBASE
  )
  if (!transaction) {
    throw new Error(`couldn't build transaction`)
  }
  const signedTx = await tronWeb.trx.sign(transaction)
  const sendRes = await tronWeb.trx.sendRawTransaction(signedTx)

  const { message } = sendRes
  if (message) {
    throw new Error(`submit error: ${Buffer.from(message, 'hex').toString()}`)
  }
  console.log(`Sent transaction: ${sendRes.txid}`)
  const confirmedTx = await getConfirmedTx(tronWeb, sendRes.txid, confirmation, 3)
  return confirmedTx
}

main()
  .then(console.log)
  .catch(console.trace)