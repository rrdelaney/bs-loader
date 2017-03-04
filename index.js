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
  execFile(bsb, ['-make-world'], (err, stdout, stderr) => {
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

  if (this._compilation._hasRunBsb) {
    readFile(compiledFilePath, callback)
  } else {
    runBsb((err, res) => {
      if (err) return callback(err, res)

      this._compilation._hasRunBsb = true
      readFile(compiledFilePath, callback)
    })
  }
}
