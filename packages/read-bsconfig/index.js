const { readFile, readFileSync } = require('fs')
const path = require('path')
const JSON5 = require('json5')

let asyncConfigCache = {}

function readBsConfig(cwd = process.cwd(), enableCache = true) {
  if (asyncConfigCache[cwd] && enableCache) return asyncConfigCache[cwd]

  asyncConfigCache[cwd] = new Promise((resolve, reject) => {
    readFile(path.join(cwd, 'bsconfig.json'), (err, res) => {
      if (err) return reject(err)

      resolve(JSON5.parse(res.toString()))
    })
  })

  return asyncConfigCache[cwd]
}

let syncConfigCache = {}

function readBsConfigSync(cwd = process.cwd(), enableCache = true) {
  if (syncConfigCache[cwd] && enableCache) return syncConfigCache[cwd]

  const content = readFileSync(path.join(cwd, 'bsconfig.json'))
  syncConfigCache[cwd] = JSON5.parse(content.toString())

  return syncConfigCache[cwd]
}

function clearCache() {
  asyncConfigCache = {}
  syncConfigCache = {}
}

module.exports = { readBsConfig, readBsConfigSync, clearCache }
