require('dotenv').config()
const client = require('theblockchainapi')

let defaultClient = client.ApiClient.instance
let APIKeyID = defaultClient.authentications['APIKeyID']
let APISecretKey = defaultClient.authentications['APISecretKey']

APIKeyID.apiKey = process.env.KEY_ID
APISecretKey.apiKey = process.env.SECRET

let apiInstance = new client.SolanaNFTApi()

const search_nfts = async (request) =>  {
    let result = await apiInstance.solanaSearchNFTs(
        {
          'nFTSearchRequest': request
        }
    )
    return result
}

const main = async () => {
  let request = new client.NFTSearchRequest()
  request.name = 'Box Roll Film NFT'
  request.name_search_method = 'begins_with'
  request.network = 'devnet'
  return await search_nfts(request)
}

main()
  .then(console.log)
  .catch(console.error)
