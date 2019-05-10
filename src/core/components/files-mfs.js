'use strict'

const mfs = require('ipfs-mfs/core')
const toPullStream = require('async-iterator-to-pull-stream')
const toReadableStream = require('async-iterator-to-stream')
const all = require('async-iterator-all')
const callbackify = require('util').callbackify
const PassThrough = require('stream').PassThrough
const pull = require('pull-stream/pull')
const map = require('pull-stream/throughs/map')

const mapLsFile = (options = {}) => {
  const long = options.long || options.l

  return (file) => {
    console.info(file)

    return {
      hash: long ? file.cid.toBaseEncodedString(options.cidBase) : '',
      name: file.name,
      type: long ? file.type : 0,
      size: long ? file.size || 0 : 0
    }
  }
}

module.exports = self => {
  const methods = mfs({
    ipld: self._ipld,
    blocks: self._blockService,
    datastore: self._repo.root,
    repoOwner: self._options.repoOwner
  })

  return {
    cp: callbackify(methods.cp),
    flush: callbackify(methods.flush),
    ls: callbackify(async (path, options) => {
      const files = await all(methods.ls(path, options))

      return files.map(mapLsFile(options))
    }),
    lsReadableStream: (path, options) => {
      const stream = toReadableStream.obj(methods.ls(path, options))
      const through = new PassThrough({
        objectMode: true
      })
      stream.on('data', (file) => through.emit('data', mapLsFile(options)(file)))
      stream.on('error', through.emit.bind(through, 'error'))
      stream.on('end', through.emit.bind(through, 'end'))

      return through
    },
    lsPullStream: (path, options) => {
      return pull(
        toPullStream.source(methods.ls(path, options)),
        map(mapLsFile(options))
      )
    },
    mkdir: callbackify(methods.mkdir),
    mv: callbackify(methods.mv),
    read: callbackify(async (path, options) => {
      return Buffer.concat(await all(methods.read(path, options)))
    }),
    readPullStream: (path, options) => {
      return toReadableStream(methods.read(path, options))
    },
    readReadableStream: (path, options) => {
      return toPullStream.source(methods.read(path, options))
    },
    rm: callbackify(methods.rm),
    stat: callbackify(methods.stat),
    write: callbackify(methods.write)
  }
}