'use strict'
const mergeOptions = require('merge-options')
const multicodec = require('multicodec')
const ipldDagCbor = require('ipld-dag-cbor')
const ipldDagPb = require('ipld-dag-pb')
const ipldRaw = require('ipld-raw')

// All known (non-default) IPLD formats
const IpldFormats = {
  get [multicodec.BITCOIN_BLOCK] () {
    return require('ipld-bitcoin')
  },
  get [multicodec.ETH_ACCOUNT_SNAPSHOT] () {
    return require('ipld-ethereum').ethAccountSnapshot
  },
  get [multicodec.ETH_BLOCK] () {
    return require('ipld-ethereum').ethBlock
  },
  get [multicodec.ETH_BLOCK_LIST] () {
    return require('ipld-ethereum').ethBlockList
  },
  get [multicodec.ETH_STATE_TRIE] () {
    return require('ipld-ethereum').ethStateTrie
  },
  get [multicodec.ETH_STORAGE_TRIE] () {
    return require('ipld-ethereum').ethStorageTrie
  },
  get [multicodec.ETH_TX] () {
    return require('ipld-ethereum').ethTx
  },
  get [multicodec.ETH_TX_TRIE] () {
    return require('ipld-ethereum').ethTxTrie
  },
  get [multicodec.GIT_RAW] () {
    return require('ipld-git')
  },
  get [multicodec.ZCASH_BLOCK] () {
    return require('ipld-zcash')
  }
}

module.exports = (blockService, options = {}, log) => {
  return mergeOptions.call(
    // ensure we have the defaults formats even if the user overrides `formats: []`
    { concatArrays: true },
    {
      blockService: blockService,
      formats: [ipldDagCbor, ipldDagPb, ipldRaw],
      loadFormat: async (codec) => {
        log('Loading IPLD format', codec)
        if (IpldFormats[codec]) {
          return IpldFormats[codec]
        } else {
          throw new Error(`Missing IPLD format "${codec}"`)
        }
      }
    }, options)
}
