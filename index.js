const path = require('path')
const { readFile } = require('fs')
const { execFile } = require('child_process')
const { getOptions } = require('loader-utils')
const bsb = require.resolve('bs-platform/bin/bsb')

const outputDir = 'lib'

const getJsFile = (moduleDir, resourcePath) => {
  const mlFileName = resourcePath.replace(process.cwd(), '')
  const jsFileName = mlFileName.replace(/\.(ml|re)$/, '.js')
  return path.join(process.cwd(), outputDir, moduleDir, jsFileName)
}

const transformSrc = src =>
  src.replace(/(require\("\.\/.*)(\.js)("\);)/g, '$1$3')

const runBsb = callback => {
  execFile(bsb, ['-make-world'], callback)
}

const getCompiledFile = (path, callback) => {
  runBsb((err, res) => {
    if (err) return callback(err, res)

    readFile(path, (err, res) => {
      if (err) {
        callback(err, err)
      } else {
        const src = transformSrc(res.toString())
        callback(null, src)
      }
    })
  })
}

module.exports = function () {
  const options = getOptions(this) || {}
  const errorType = options.errorType || 'error'
  const moduleDir = options.module || 'js'

  this.addDependency(this.resourcePath + 'i')
  const callback = this.async()
  const compiledFilePath = getJsFile(moduleDir, this.resourcePath)

  getCompiledFile(compiledFilePath, (err, res) => {
    if (err && errorType === 'warning') {
      this.emitWarning(res)
      callback(null, '')
    } else if (err) {
      this.emitError(res)
      callback(err, null)
    } else {
      callback(null, res)
    }
  })
}
