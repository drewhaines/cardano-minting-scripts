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

const assets = require("./assets-mint.json")
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
