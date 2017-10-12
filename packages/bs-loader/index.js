// @flow

const { readBsConfig } = require('read-bsconfig')
const path = require('path')
const os = require('os')
const { readFile, readFileSync } = require('fs')
const { exec, execSync } = require('child_process')
const { getOptions } = require('loader-utils')
/*:: import type { WebpackLoaderThis } from 'webpack' */

let bsbCommand
try {
  bsbCommand = require.resolve('bs-platform/bin/bsb.exe')
} catch (e) {
  bsbCommand = `bsb`
}

const bsb =
  os.platform() === 'darwin'
    ? `script -q /dev/null ${bsbCommand} -make-world -color`
    : os.platform() === 'linux'
      ? `script --return -qfc "${bsbCommand} -make-world -color" /dev/null`
      : `${bsbCommand} -make-world`

const outputDir = 'lib'
const CWD = process.cwd()

const fileNameRegex = /\.(ml|re)$/
const es6ReplaceRegex = /(from\ "\.\.?\/.*)(\.js)("\;)/g
const commonJsReplaceRegex = /(require\("\.\.?\/.*)(\.js)("\);)/g
const getErrorRegex = /(File [\s\S]*?:\n|Fatal )[eE]rror: [\s\S]*?(?=ninja|\n\n|$)/g
const getSuperErrorRegex = /We've found a bug for you![\s\S]*?(?=ninja: build stopped)/g
const getWarningRegex = /((File [\s\S]*?Warning.+? \d+:)|Warning number \d+)[\s\S]*?(?=\[\d+\/\d+\]|$)/g

function jsFilePath(buildDir, moduleDir, resourcePath, inSource) {
  const mlFileName = resourcePath.replace(buildDir, '')
  const jsFileName = mlFileName.replace(fileNameRegex, '.js')

  if (inSource) {
    return path.join(buildDir, jsFileName)
  }

  return path.join(buildDir, outputDir, moduleDir, jsFileName)
}

function transformSrc(moduleDir, src) {
  const replacer = moduleDir === 'es6' ? es6ReplaceRegex : commonJsReplaceRegex

  return src.replace(replacer, '$1$3')
}

function runBsb(buildDir, compilation) {
  if (!compilation.bsbRunner) {
    compilation.bsbRunner = new Promise((resolve, reject) => {
      exec(
        bsb,
        { maxBuffer: Infinity, cwd: buildDir },
        (err, stdout, stderr) => {
          const output = `${stdout.toString()}\n${stderr.toString()}`
          if (err) {
            reject(output)
          } else {
            resolve(output)
          }
        }
      )
    })
  }

  return compilation.bsbRunner
}

function runBsbSync() {
  execSync(bsb, { stdio: 'pipe' })
}

function processBsbError(err) {
  if (typeof err === 'string')
    return err.match(
      err.includes('-bs-super-errors') ? getSuperErrorRegex : getErrorRegex
    )

  if (err.message) return [err.message]

  return undefined
}

function getCompiledFile(buildDir, compilation, moduleDir, path) {
  return runBsb(buildDir, compilation).then((output) => {
    return new Promise((resolve, reject) => {
      readFile(path, (err, res) => {
        if (err) {
          reject(err)
        } else {
          const src = transformSrc(moduleDir, res.toString())
          resolve({ src, output })
        }
      })
    })
  })
}

function getCompiledFileSync(moduleDir, path) {
  try {
    runBsbSync()
  } catch (e) {
    throw e.output.toString()
  }

  const res = readFileSync(path)
  return transformSrc(moduleDir, res.toString())
}

function getBsConfigModuleOptions(buildDir) {
  return readBsConfig(buildDir).then(bsconfig => {
    if (!bsconfig) {
      throw new Error(`bsconfig not found in ${buildDir}`)
    }

    if (!bsconfig['package-specs'] || !bsconfig['package-specs'].length) {
      return { module: 'js', inSource: false }
    }

    const moduleSpec = bsconfig['package-specs'][0]
    const moduleDir =
      typeof moduleSpec === 'string' ? moduleSpec : moduleSpec.module
    const inSource =
      typeof moduleSpec === 'string' ? false : moduleSpec['in-source']

    return { moduleDir, inSource }
  })
}

module.exports = function loader() {
  const options = getOptions(this) || {}
  const buildDir = options.cwd || CWD
  const callback = this.async()

  this.addContextDependency(this.context)

  getBsConfigModuleOptions(buildDir).then(bsconfig => {
    const moduleDir = options.module || bsconfig.moduleDir || 'js'
    const inSourceBuild = options.inSource || bsconfig.inSource || false
    const showWarnings = (options.showWarnings !== undefined) ? options.showWarnings : true

    const compiledFilePath = jsFilePath(
      buildDir,
      moduleDir,
      this.resourcePath,
      inSourceBuild
    )

    getCompiledFile(buildDir, this._compilation, moduleDir, compiledFilePath)
      .then(({ src, output }) => {
        if (output && showWarnings) {
          const warningMessages = output.match(getWarningRegex)
          if (warningMessages) {
            warningMessages.forEach(message => {
              this.emitWarning(new Error(message))
            });
          }
        }

        callback(null, src)
      })
      .catch(err => {
        if (err instanceof Error) err = err.toString()
        const errorMessages = processBsbError(err)

        if (!errorMessages) {
          if (!(err instanceof Error)) err = new Error(err)
          this.emitError(err)
          return callback(err, null)
        }

        for (let i = 0; i < errorMessages.length - 1; ++i) {
          this.emitError(new Error(errorMessages[i]))
        }

        callback(new Error(errorMessages[errorMessages.length - 1]), null)
      })
  })
}

/*:: declare var c: WebpackLoaderThis; module.exports.call(c) */

module.exports.process = function process(
  src /*: string */,
  filename /*: string */
) {
  const moduleDir = 'js'
  const compiledFilePath = jsFilePath(CWD, moduleDir, filename, false)

  try {
    return getCompiledFileSync(moduleDir, compiledFilePath)
  } catch (err) {
    if (err instanceof Error) err = err.toString()
    const bsbErrorMessages = processBsbError(err)

    if (bsbErrorMessages && bsbErrorMessages.length > 0) {
      throw new Error(bsbErrorMessages[0])
    } else {
      throw err
    }
  }
}
