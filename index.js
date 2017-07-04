const path = require('path')
const { readFile, readFileSync } = require('fs')
const { execFile, execFileSync } = require('child_process')
const { getOptions } = require('loader-utils')

let bsb
try {
  bsb = require.resolve('bs-platform/bin/bsb')
} catch (e) {
  bsb = 'bsb'
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
  execFileSync(bsb, ['-make-world'], { stdio: 'pipe' })
}

const getBsbErrorMessages = err => err.match(/File [\s\S]*?:\nError: [\s\S]*?\n/g)

const getCompiledFile = (moduleDir, path, callback) => {
  runBsb((err, stdout, stderr) => {
    if (err) return callback(stderr, null, stdout)

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
  try {
    runBsbSync()
  } catch (e) {
    throw e.output.toString()
  }

  const res = readFileSync(path)
  return transformSrc(moduleDir, res.toString())
}

module.exports = function loader () {
  const options = getOptions(this) || {}
  const moduleDir = options.module || 'js'

  this.addContextDependency(this.context)
  const callback = this.async()
  const compiledFilePath = getJsFile(moduleDir, this.resourcePath)

  getCompiledFile(moduleDir, compiledFilePath, (err, res, stdout) => {
    if (err) {
      const errorMessages = getBsbErrorMessages(stdout)

      if (!errorMessages) {
        if (!(err instanceof Error)) err = new Error(err)
        this.emitError(err)
        return callback(err, null)
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

  try {
    return getCompiledFileSync(moduleDir, compiledFilePath)
  } catch (err) {
    const bsbErrorMessages = getBsbErrorMessages(err)

    if (bsbErrorMessages && bsbErrorMessages.length > 0) {
      throw new Error(bsbErrorMessages[0])
    } else {
      throw err
    }
  }
}
