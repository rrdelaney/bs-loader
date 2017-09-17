const path = require('path')
const os = require('os')
const { readFile, readFileSync } = require('fs')
const { exec, execSync } = require('child_process')
const { getOptions } = require('loader-utils')

let bsb
try {
  bsb = require.resolve('bs-platform/bin/bsb.exe');
} catch (e) {
  bsb = `bsb`
}

if(os.platform() === 'darwin') {
  bsb = `script -q /dev/null "${bsb} -make-world -color"`
} else {
  bsb = `script --return -qfc "${bsb} -make-world -color" /dev/null`
}

const outputDir = 'lib'
const CWD = process.cwd()

const fileNameRegex = /\.(ml|re)$/
const es6ReplaceRegex = /(from\ "\.\.?\/.*)(\.js)("\;)/g
const commonJsReplaceRegex = /(require\("\.\.?\/.*)(\.js)("\);)/g
const getErrorRegex = /(File [\s\S]*?:\n|Fatal )[eE]rror: [\s\S]*?(?=ninja|\n\n|$)/g
const getSuperErrorRegex = /We've found a bug for you![\s\S]*?(?=ninja: build stopped)/g

const getJsFile = (buildDir, moduleDir, resourcePath, inSource) => {
  const mlFileName = resourcePath.replace(buildDir, '')
  const jsFileName = mlFileName.replace(fileNameRegex, '.js')

  if (inSource) {
    return path.join(buildDir, jsFileName)
  }

  return path.join(buildDir, outputDir, moduleDir, jsFileName)
}

const transformSrc = (moduleDir, src) =>
  moduleDir === 'es6'
    ? src.replace(es6ReplaceRegex, '$1$3')
    : src.replace(commonJsReplaceRegex, '$1$3')

const runBsb = (buildDir, compilation, callback) => {
  if (compilation.__HAS_RUN_BSB__) return callback()
  compilation.__HAS_RUN_BSB__ = true

  exec(
    bsb,
    { maxBuffer: Infinity, cwd: buildDir },
    callback
  )
}

const runBsbSync = () => {
  execSync(bsb, { stdio: 'pipe' })
}

const getBsbErrorMessages = err => {
  if (typeof err === 'string')
    return err.match(
      err.includes('-bs-super-errors') ? getSuperErrorRegex : getErrorRegex
    )

  if (err.message) return [err.message]

  return undefined
}

const getCompiledFile = (buildDir, compilation, moduleDir, path, callback) => {
  runBsb(buildDir, compilation, (err, stdout, stderr) => {
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

module.exports = function loader() {
  const options = getOptions(this) || {}
  const buildDir = options.cwd || CWD
  const moduleDir = options.module || 'js'
  const inSourceBuild = options.inSource || false

  this.addContextDependency(this.context)
  const callback = this.async()
  const compiledFilePath = getJsFile(
    buildDir,
    moduleDir,
    this.resourcePath,
    inSourceBuild
  )

  getCompiledFile(
    buildDir,
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
  const compiledFilePath = getJsFile(CWD, moduleDir, filename, false)

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
