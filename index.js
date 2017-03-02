const path = require('path')
const { readFile } = require('fs')
const { execFile } = require('child_process')
const bsb = require.resolve('bs-platform/bin/bsb')

const getJsFile = resourcePath => {
  const mlFileName = resourcePath.replace(process.cwd(), '')
  const jsFileName = mlFileName.replace(/.(ml|re)$/, '.js')
  return path.join(process.cwd(), 'lib', 'js', jsFileName)
}

const runBsb = callback => {
  execFile(bsb, (err, stdout, stderr) => {
    if (err) {
      callback(stdout, null)
    } else {
      callback(null, stdout)
    }
  })
}

module.exports = function () {
  const callback = this.async()

  const compiledFilePath = getJsFile(this.resourcePath)

  runBsb((err, res) => {
    if (err) return callback(err, res)

    readFile(compiledFilePath, (err, data) => {
      if (err) return callback(err, null)

      callback(null, data)
    })
  })
}
