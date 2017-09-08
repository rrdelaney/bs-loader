const { readFile, readFileSync } = require('fs')
const path = require('path')
const JSON5 = require('json5')

function readBsConfig(cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    readFile(path.join(cwd, 'bsconfig.json'), (err, res) => {
      if (err) return reject(err)

      resolve(JSON5.parse(res.toString()))
    })
  })
}

function readBsConfigSync(cwd = process.cwd()) {
  const content = readFileSync(path.join(cwd, 'bsconfig.json'))

  return JSON5.parse(content.toString())
}

module.exports = { readBsConfig, readBsConfigSync }
