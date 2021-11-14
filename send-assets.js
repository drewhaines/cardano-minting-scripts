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

// send asssets
const assets = require("./assets-send.json")
const mintScript = require("./mint-policy.json")
const POLICY_ID = cardanocliJs.transactionPolicyid(mintScript)
const sender = cardanocliJs.wallet("CardanoAudio1")

console.log(
  "Balance of Sender address" +
    cardanocliJs.toAda(sender.balance().value.lovelace) +
    " ADA"
)

function sendAssets({ receiver, assets }) {
  const txOut_value_sender = assets.reduce(
    (result, asset) => {
      const ASSET_ID = POLICY_ID + "." + asset
      delete result[ASSET_ID]
      return result
    },
    {
      ...sender.balance().value,
    }
  )

  const txOut_value_receiver = assets.reduce((result, asset) => {
    const ASSET_ID = POLICY_ID + "." + asset
    result[ASSET_ID] = 1
    return result
  }, {})

  // This is depedent at the network, try to increase this value of ADA
  // if you get an error saying: OutputTooSmallUTxO
  const MIN_ADA = 2

  const txInfo = {
    txIn: cardanocliJs.queryUtxo(sender.paymentAddr),
    txOut: [
      {
        address: sender.paymentAddr,
        value: {
          ...txOut_value_sender,
          lovelace:
            txOut_value_sender.lovelace - cardanocliJs.toLovelace(MIN_ADA),
        },
      },
      {
        address: receiver,
        value: {
          lovelace: cardanocliJs.toLovelace(MIN_ADA),
          ...txOut_value_receiver,
        },
      },
    ],
  }

  const raw = cardanocliJs.transactionBuildRaw(txInfo)

  const fee = cardanocliJs.transactionCalculateMinFee({
    ...txInfo,
    txBody: raw,
    witnessCount: 1,
  })

  txInfo.txOut[0].value.lovelace -= fee

  const tx = cardanocliJs.transactionBuildRaw({ ...txInfo, fee })

  const txSigned = cardanocliJs.transactionSign({
    txBody: tx,
    signingKeys: [sender.payment.skey],
  })

  const txHash = cardanocliJs.transactionSubmit(txSigned)

  console.log(txHash)
}

sendAssets({
  receiver:
    "addr1qxcfx0y0j5ghxrm0m7vxktdc36mpm0qcqx03krqz4v68k7m8m2k9nawdkul3jxgc6au2470satwl3qpgdz0qzt3n532s9cjhg4",
  assets: assets.map((asset) => asset.id),
})

// levi address
// addr1qxcfx0y0j5ghxrm0m7vxktdc36mpm0qcqx03krqz4v68k7m8m2k9nawdkul3jxgc6au2470satwl3qpgdz0qzt3n532s9cjhg4

// drew address
// addr1q85khjtrn255q8d9kjdysl9kn9kzumskdnerqf77evz6l5jmlcy7y7703za4cy7zh789jnjffstkgsgk5vhr5ks6vj5qejsare
