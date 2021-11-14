const CardanocliJs = require("/Users/drewhaines/sites/cardanocli-js/index")
const socketPath =
  "/Users/drewhaines/Library/Application Support/Daedalus Mainnet/cardano-node.socket"
const testnet_socketPath =
  "/Users/drewhaines/Library/Application Support/Daedalus Testnet/cardano-node.socket"
const shelleyGenesisPath =
  "/Users/drewhaines/sites/cardano-node-1.29.0-macos/configuration/cardano/mainnet-shelley-genesis.json"
const cliPath = "/Users/drewhaines/sites/cardano-node-1.29.0-macos/cardano-cli"

const cardanocliJs = new CardanocliJs({
  shelleyGenesisPath,
  cliPath,
  socketPath,
})

// query the tip
console.log(cardanocliJs.queryTip())

// create new wallet
const createWallet = (account) => {
  const payment = cardanocliJs.addressKeyGen(account)
  const stake = cardanocliJs.stakeAddressKeyGen(account)
  cardanocliJs.stakeAddressBuild(account)
  cardanocliJs.addressBuild(account, {
    paymentVkey: payment.vkey,
    stakeVkey: stake.vkey,
  })
  return cardanocliJs.wallet(account)
}

let wallet = cardanocliJs.wallet("CardanoAudio1")

cardanocliJs.queryUtxo(wallet.paymentAddr)

console.log(cardanocliJs.queryTip())
console.log(
  cardanocliJs.queryUtxo(
    "addr1qyla0ljd9qgr50tss6zz5c2slkevvrxd6kjxnu64vpj7dhesst7y5kkhatxzmrflqju6jcgezeye077tm5yyt7x3h5es8xn2fk"
  )
)

// Simple Transaction

const sender = cardanocliJs.wallet("CardanoAudio1")
console.log(
  "Balance of Sender wallet: " +
    cardanocliJs.toAda(sender.balance().value.lovelace) +
    " ADA"
)

const receiver =
  "addr1q9v9a4kpnh99wuyrzg0xt45mxn6sakhlcxg5vwfnvnq66n0tvcppmuk6sxlazpr5pmwl73z0j9s5padq4ukjjc76prrq6qx554"

// create raw transaction
let txInfo = {
  txIn: cardanocliJs.queryUtxo(sender.paymentAddr),
  txOut: [
    {
      address: sender.paymentAddr,
      value: {
        lovelace: sender.balance().value.lovelace - cardanocliJs.toLovelace(2),
      },
    }, //value going back to sender
    { address: receiver, value: { lovelace: cardanocliJs.toLovelace(2) } }, //value going to receiver
  ],
  metadata: { 1: { cardanocliJs: "Using cardanocli-js" } },
}
let raw = cardanocliJs.transactionBuildRaw(txInfo)

//calculate fee
let fee = cardanocliJs.transactionCalculateMinFee({
  ...txInfo,
  txBody: raw,
  witnessCount: 1,
})

//pay the fee by subtracting it from the sender utxo
txInfo.txOut[0].value.lovelace -= fee

//create final transaction
let tx = cardanocliJs.transactionBuildRaw({ ...txInfo, fee })

//sign the transaction
let txSigned = cardanocliJs.transactionSign({
  txBody: tx,
  signingKeys: [sender.payment.skey],
})

//broadcast transaction
let txHash = cardanocliJs.transactionSubmit(txSigned)
console.log("TxHash: " + txHash)

const sendAda = (walletName, receivingAddress, lovelace) => {
  const sender = cardanocliJs.wallet(walletName)

  console.log(
    "Balance of Sender wallet: " +
      cardanocliJs.toAda(sender.balance().value.lovelace) +
      " ADA"
  )

  const receiver = receivingAddress

  // create raw transaction
  let txInfo = {
    txIn: cardanocliJs.queryUtxo(sender.paymentAddr),
    txOut: [
      {
        address: sender.paymentAddr,
        value: {
          lovelace: sender.balance().value.lovelace - lovelace,
        },
      }, //value going back to sender
      { address: receiver, value: { lovelace: lovelace } }, //value going to receiver
    ],
    metadata: { 1: { cardanocliJs: "Using cardanocli-js" } },
  }
  let raw = cardanocliJs.transactionBuildRaw(txInfo)

  //calculate fee
  let fee = cardanocliJs.transactionCalculateMinFee({
    ...txInfo,
    txBody: raw,
    witnessCount: 1,
  })

  //pay the fee by subtracting it from the sender utxo
  txInfo.txOut[0].value.lovelace -= fee

  //create final transaction
  let tx = cardanocliJs.transactionBuildRaw({ ...txInfo, fee })

  //sign the transaction
  let txSigned = cardanocliJs.transactionSign({
    txBody: tx,
    signingKeys: [sender.payment.skey],
  })

  //broadcast transaction
  let txHash = cardanocliJs.transactionSubmit(txSigned)
  console.log("TxHash: " + txHash)
}

const walletName1 = "CardanoAudio1"
const recieve =
  "addr1qyh4gptqdyuyr239fkvx57tmk67p58exglenp7v6pn5vkm2mlcy7y7703za4cy7zh789jnjffstkgsgk5vhr5ks6vj5qpdxvv7"
const lovelace = 3000000

sendAda(walletName1, recieve, lovelace)

const sendMuplitpleTokens = () => {}







// send asssets



const cardano = require("./cardano")
const assets = require("./assets.json")
const getPolicyId = require('./get-policy-id')

const sender = cardano.wallet("ADAPI")

console.log(
    "Balance of Sender address" +
    cardano.toAda(sender.balance().value.lovelace) + " ADA"
)

const { policyId: POLICY_ID } = getPolicyId()

function sendAssets({ receiver, assets }) {

    const txOut_value_sender = assets.reduce((result, asset) => {

        const ASSET_ID = POLICY_ID + "." + asset
        delete result[ASSET_ID]
        return result
    }, {
        ...sender.balance().value
    })

    const txOut_value_receiver = assets.reduce((result, asset) => {

        const ASSET_ID = POLICY_ID + "." + asset
        result[ASSET_ID] = 1
        return result
    }, {})

    // This is depedent at the network, try to increase this value of ADA
    // if you get an error saying: OutputTooSmallUTxO
    const MIN_ADA = 3

    const txInfo = {
        txIn: cardano.queryUtxo(sender.paymentAddr),
        txOut: [
            {
                address: sender.paymentAddr,
                value: {
                    ...txOut_value_sender,
                    lovelace: txOut_value_sender.lovelace - cardano.toLovelace(MIN_ADA)
                }
            },
            {
                address: receiver,
                value: {
                    lovelace: cardano.toLovelace(MIN_ADA),
                    ...txOut_value_receiver
                }
            }
        ]
    }

    const raw = cardano.transactionBuildRaw(txInfo)

    const fee = cardano.transactionCalculateMinFee({
        ...txInfo,
        txBody: raw,
        witnessCount: 1
    })

    txInfo.txOut[0].value.lovelace -= fee

    const tx = cardano.transactionBuildRaw({ ...txInfo, fee })

    const txSigned = cardano.transactionSign({
        txBody: tx,
        signingKeys: [sender.payment.skey]
    })

    const txHash = cardano.transactionSubmit(txSigned)

    console.log(txHash)
}

sendAssets({
    receiver: "addr1qylm539axczhyvdh90f6c09ptrz8asa4hgq8u5shkw3v9vjae9ftypmc8tmd2rrwngdxm4sr3tpzmxw4zyg3z7vttpwsl0alww",
    assets: assets.map(asset => asset.id)
})






const mintAsset = () => {}

const burnAsset = () => {}

const mintMultipleAssets = () => {}

const burnMultipleAssets = () => {}

// create open policy for wallet
const wallet = cardanocliJs.wallet("CardanoAudio1")

const mintScript = {
  keyHash: cardanocliJs.addressKeyHash(wallet.name),
  type: "sig",
}

fs.writeFileSync("./mint-policy.json", JSON.stringify(mintScript, null, 2))
fs.writeFileSync(
  "./mint-policy-id.txt",
  cardanocliJs.transactionPolicyid(mintScript)
)

// mint multiple assets at once

const CardanocliJs = require("/Users/drewhaines/sites/cardanocli-js/index")
const socketPath =
  "/Users/drewhaines/Library/Application Support/Daedalus Mainnet/cardano-node.socket"
const testnet_socketPath =
  "/Users/drewhaines/Library/Application Support/Daedalus Testnet/cardano-node.socket"
const shelleyGenesisPath =
  "/Users/drewhaines/sites/cardano-node-1.29.0-macos/configuration/cardano/mainnet-shelley-genesis.json"
const cliPath = "/Users/drewhaines/sites/cardano-node-1.29.0-macos/cardano-cli"

const cardanocliJs = new CardanocliJs({
  shelleyGenesisPath,
  cliPath,
  socketPath,
})

// query the tip
console.log(cardanocliJs.queryTip())

const assets = require("./assets.json")
const mintScript = require("./mint-policy.json")
const POLICY_ID = cardanocliJs.transactionPolicyid(mintScript)

const wallet = cardanocliJs.wallet("CardanoAudio1")

const metadata_assets = assets.reduce((result, asset) => {
  const ASSET_ID = asset.id

  // remove id property from the asset metadata
  const asset_metadata = {
    ...asset,
  }

  delete asset_metadata.id

  return {
    ...result,
    [ASSET_ID]: asset_metadata,
  }
}, {})

const metadata = {
  721: {
    [POLICY_ID]: {
      ...metadata_assets,
    },
  },
}

const txOut_value = assets.reduce(
  (result, asset) => {
    const ASSET_ID = POLICY_ID + "." + asset.id
    result[ASSET_ID] = 1
    return result
  },
  {
    ...wallet.balance().value,
  }
)

const mint_actions = assets.map((asset) => ({
  action: "mint",
  quantity: 1,
  asset: POLICY_ID + "." + asset.id,
}))

const tx = {
  txIn: wallet.balance().utxo,
  txOut: [
    {
      address: wallet.paymentAddr,
      value: txOut_value,
    },
  ],
  mint: {
    actions: mint_actions,
    script: mintScript,
  },
  scriptPath: "/Users/drewhaines/sites/cardano-audio-new/mint-policy.json",
  metadata,
  witnessCount: 2,
}

const buildTransaction = (tx) => {
  const raw = cardanocliJs.transactionBuildRaw(tx)
  const fee = cardanocliJs.transactionCalculateMinFee({
    ...tx,
    txBody: raw,
  })

  tx.txOut[0].value.lovelace -= fee

  return cardanocliJs.transactionBuildRaw({ ...tx, fee })
}

const raw = buildTransaction(tx)

// 9. Sign transaction

const signTransaction = (wallet, tx) => {
  return cardanocliJs.transactionSign({
    signingKeys: [wallet.payment.skey, wallet.payment.skey],
    txBody: tx,
  })
}

const signed = signTransaction(wallet, raw, mintScript)

// 10. Submit transaction

const txHash = cardanocliJs.transactionSubmit(signed)

console.log(txHash)







// burn multiple assets at once

const CardanocliJs = require("/Users/drewhaines/sites/cardanocli-js/index")
const socketPath =
  "/Users/drewhaines/Library/Application Support/Daedalus Mainnet/cardano-node.socket"
const testnet_socketPath =
  "/Users/drewhaines/Library/Application Support/Daedalus Testnet/cardano-node.socket"
const shelleyGenesisPath =
  "/Users/drewhaines/sites/cardano-node-1.29.0-macos/configuration/cardano/mainnet-shelley-genesis.json"
const cliPath = "/Users/drewhaines/sites/cardano-node-1.29.0-macos/cardano-cli"

const cardanocliJs = new CardanocliJs({
  shelleyGenesisPath,
  cliPath,
  socketPath,
})

// query the tip
console.log(cardanocliJs.queryTip())

const assets = require("./assets.json")
const mintScript = require("./mint-policy.json")
const POLICY_ID = cardanocliJs.transactionPolicyid(mintScript)

const wallet = cardanocliJs.wallet("CardanoAudio1")

const metadata_assets = assets.reduce((result, asset) => {
  const ASSET_ID = asset.id

  // remove id property from the asset metadata
  const asset_metadata = {
    ...asset,
  }

  delete asset_metadata.id

  return {
    ...result,
    [ASSET_ID]: asset_metadata,
  }
}, {})

const metadata = {
  721: {
    [POLICY_ID]: {
      ...metadata_assets,
    },
  },
}

const txOut_value = assets.reduce(
  (result, asset) => {
    const ASSET_ID = POLICY_ID + "." + asset.id
    result[ASSET_ID] = 0
    return result
  },
  {
    ...wallet.balance().value,
  }
)

const mint_actions = assets.map((asset) => ({
  action: "mint",
  quantity: -1,
  asset: POLICY_ID + "." + asset.id,
}))

const tx = {
  txIn: wallet.balance().utxo,
  txOut: [
    {
      address: wallet.paymentAddr,
      value: txOut_value,
    },
  ],
  mint: {
    actions: mint_actions,
    script: mintScript,
  },
  scriptPath: "/Users/drewhaines/sites/cardano-audio-new/mint-policy.json",
  metadata,
  witnessCount: 2,
}

const buildTransaction = (tx) => {
  const raw = cardanocliJs.transactionBuildRaw(tx)
  const fee = cardanocliJs.transactionCalculateMinFee({
    ...tx,
    txBody: raw,
  })

  tx.txOut[0].value.lovelace -= fee

  return cardanocliJs.transactionBuildRaw({ ...tx, fee })
}

const raw = buildTransaction(tx)

// 9. Sign transaction

const signTransaction = (wallet, tx) => {
  return cardanocliJs.transactionSign({
    signingKeys: [wallet.payment.skey, wallet.payment.skey],
    txBody: tx,
  })
}

const signed = signTransaction(wallet, raw, mintScript)

// 10. Submit transaction

const txHash = cardanocliJs.transactionSubmit(signed)

console.log(txHash)
