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
  execFile(bsb, ['-make-world'], callback)
}

module.exports = function () {
  this.addDependency(this.resourcePath + 'i')
  const callback = this.async()
  const compiledFilePath = getJsFile(this.resourcePath)

  runBsb((err, res) => {
    if (err) {
      this.emitError(res)
      callback(err, null)
    } else {
      readFile(compiledFilePath, callback)
    }
  })
}
