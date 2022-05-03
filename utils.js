function sleep(intreval) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, intreval)
  })
}

async function getConfirmedCurrentBlockNumber(tronWeb) {
  const block = await tronWeb.trx.getConfirmedCurrentBlock()
  let blockNumber = 0
  if (block && block.block_header) {
    blockNumber = block.block_header.raw_data.number
  }
  return blockNumber
}

async function getConfirmedTx(tronWeb, txId, confirms, interval) {
  const tx = await tronWeb.trx.getTransactionInfo(txId)
  if (tx.blockNumber && tx.blockNumber > 0) {
    const currBln = await getConfirmedCurrentBlockNumber(tronWeb)
    if (currBln > 0 && (currBln - tx.blockNumber) > confirms) {
      return tx
    }
  }
  console.log(`Transaction ${txId} is not confirmed, sleep ${interval} second...`)
  await sleep(interval * 1000)
  return getConfirmedTx(tronWeb, txId, confirms, interval)
}

module.exports = {
  sleep,
  getConfirmedCurrentBlockNumber,
  getConfirmedTx
}