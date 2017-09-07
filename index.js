const { readFile, readFileSync } = require('fs')
const path = require('path')
const JSON5 = require('json5')

async function readBsConfig(cwd = process.cwd()) {
  const content = await new Promise((resolve, reject) => {
    readFile(path.join(cwd, 'bsconfig.json'), (err, res) => {
      if (err) return reject(err)

      resolve(res)
    })
  })

  return JSON5.parse(content.toString())
}

function readBsConfigSync(cwd = process.cwd()) {
  const content = readFileSync(path.join(cwd, 'bsconfig.json'))

  return JSON5.parse(content.toString())
}

module.exports = { readBsConfig, readBsConfigSync }
