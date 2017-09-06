const { readFile } = require('fs')
const path = require('path')
const JSON5 = require('json5')

async function readBsconfig(cwd = process.cwd()) {
  const content = await new Promise((resolve, reject) => {
    readFile(path.join(cwd, 'bsconfig.json'), (err, res) => {
      if (err) return reject(err)

      resolve(res)
    })
  })

  return JSON5.parse(content.toString())
}
