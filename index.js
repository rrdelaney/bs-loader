const path = require('path')
const { readFile, readFileSync } = require('fs')
const { execFile, execFileSync } = require('child_process')
const { getOptions } = require('loader-utils')

let bsb
try {
  bsb = require.resolve('bs-platform/bin/bsb')
} catch (e) {
  throw new Error('"bs-platform" must be installed locally.\nTry running "npm i -D bs-platform"')
}

const outputDir = 'lib'

const getJsFile = (moduleDir, resourcePath) => {
  const mlFileName = resourcePath.replace(process.cwd(), '')
  const jsFileName = mlFileName.replace(/\.(ml|re)$/, '.js')
  return path.join(process.cwd(), outputDir, moduleDir, jsFileName)
}

const transformSrc = (moduleDir, src) =>
  moduleDir === 'es6' ?
  src.replace(/(from\ "\.\.?\/.*)(\.js)("\;)/g, '$1$3') :
  src.replace(/(require\("\.\.?\/.*)(\.js)("\);)/g, '$1$3')


const runBsb = callback => {
  execFile(bsb, ['-make-world'], { maxBuffer: Infinity }, callback)
}

const runBsbSync = () => {
  execFileSync(bsb, ['-make-world'])
}

const getCompiledFile = (moduleDir, path, callback) => {
  runBsb((err, res) => {
    if (err) return callback(err, res)

    readFile(path, (err, res) => {
      if (err) {
        callback(err, err)
      } else {
        const src = transformSrc(moduleDir, res.toString())
        callback(null, src)
      }
    })
  })
}

const getCompiledFileSync = (moduleDir, path) => {
  runBsbSync()
  const res = readFileSync(path)
  return transformSrc(moduleDir, res.toString())
}

module.exports = function loader () {
  const options = getOptions(this) || {}
  const errorType = options.errorType || 'error'
  const moduleDir = options.module || 'js'

  this.addContextDependency(this.context)
  const callback = this.async()
  const compiledFilePath = getJsFile(moduleDir, this.resourcePath)

  getCompiledFile(moduleDir, compiledFilePath, (err, res) => {
    if (err) {
      const errorMessages = res.match(/File [\s\S]*?:\nError: [\s\S]*?\n/g)

      if (!errorMessages) {
        this.emitError(res)
        return callback(res, null)
      }

      errorMessages.slice(0, -1).forEach(msg => this.emitError(new Error(msg)))

      callback(new Error(errorMessages[0]), null)
    } else {
      callback(null, res)
    }
  })
}

module.exports.process = (src, filename) => {
  const moduleDir = 'js'
  const compiledFilePath = getJsFile(moduleDir, filename)
  return getCompiledFileSync(moduleDir, compiledFilePath)
}
