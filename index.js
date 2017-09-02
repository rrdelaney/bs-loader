const path = require('path')
const { readFile, readFileSync } = require('fs')
const { execFile, execFileSync } = require('child_process')
const { getOptions } = require('loader-utils')

let bsb
try {
  bsb = require.resolve('bs-platform/bin/bsb.exe')
} catch (e) {
  bsb = 'bsb'
}

const outputDir = 'lib'
const CWD = process.cwd()

const fileNameRegex = /\.(ml|re)$/
const es6ReplaceRegex = /(from\ "\.\.?\/.*)(\.js)("\;)/g
const commonJsReplaceRegex = /(require\("\.\.?\/.*)(\.js)("\);)/g
const getErrorRegex = /(File [\s\S]*?:\n|Fatal )[eE]rror: [\s\S]*?(?=ninja|\n\n|$)/g

const getJsFile = (moduleDir, resourcePath, inSource) => {
  const mlFileName = resourcePath.replace(CWD, '')
  const jsFileName = mlFileName.replace(fileNameRegex, '.js')
  if (inSource) {
    return path.join(CWD, jsFileName)
  }
  return path.join(CWD, outputDir, moduleDir, jsFileName)
}

const transformSrc = (moduleDir, src) =>
  moduleDir === 'es6'
    ? src.replace(es6ReplaceRegex, '$1$3')
    : src.replace(commonJsReplaceRegex, '$1$3')

const runBsb = (compilation, callback) => {
  if (compilation.__HAS_RUN_BSB__) return callback()
  compilation.__HAS_RUN_BSB__ = true

  execFile(bsb, ['-make-world'], { maxBuffer: Infinity }, callback)
}

const runBsbSync = () => {
  execFileSync(bsb, ['-make-world'], { stdio: 'pipe' })
}

const getBsbErrorMessages = err => err.match(getErrorRegex)

const getCompiledFile = (compilation, moduleDir, path, callback) => {
  runBsb(compilation, (err, stdout, stderr) => {
    const errorOutput = `${stdout}\n${stderr}`
    if (err) return callback(errorOutput, null)

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

const isInSourceBuild = moduleOptions => {
  const bsconfig = require(`${CWD}/bsconfig.json`)
  const moduleBsSettings = bsconfig['package-specs'].find(moduleConfig => {
    // If config is only a string, it will never be an in-source build
    if (typeof moduleConfig === 'string') {
      return false
    }
    if (typeof moduleConfig === 'object') {
      return moduleConfig.module === moduleOptions
    }
    return false
  })
  return moduleBsSettings && moduleBsSettings['in-source']
}

module.exports = function loader() {
  const options = getOptions(this) || {}
  const moduleDir = options.module || 'js'

  this.addContextDependency(this.context)
  const callback = this.async()
  const compiledFilePath = getJsFile(
    moduleDir,
    this.resourcePath,
    isInSourceBuild(moduleDir)
  )

  getCompiledFile(
    this._compilation,
    moduleDir,
    compiledFilePath,
    (err, res) => {
      if (err) {
        if (err instanceof Error) err = err.toString()
        const errorMessages = getBsbErrorMessages(err)

        if (!errorMessages) {
          if (!(err instanceof Error)) err = new Error(err)
          this.emitError(err)
          return callback(err, null)
        }

        for (let i = 0; i < errorMessages.length - 1; ++i) {
          this.emitError(new Error(errorMessages[i]))
        }

        callback(new Error(errorMessages[errorMessages.length - 1]), null)
      } else {
        callback(null, res)
      }
    }
  )
}

module.exports.process = (src, filename) => {
  const moduleDir = 'js'
  const compiledFilePath = getJsFile(
    moduleDir,
    filename,
    isInSourceBuild(moduleDir)
  )

  try {
    return getCompiledFileSync(moduleDir, compiledFilePath)
  } catch (err) {
    if (err instanceof Error) err = err.toString()
    const bsbErrorMessages = getBsbErrorMessages(err)

    if (bsbErrorMessages && bsbErrorMessages.length > 0) {
      throw new Error(bsbErrorMessages[0])
    } else {
      throw err
    }
  }
}
