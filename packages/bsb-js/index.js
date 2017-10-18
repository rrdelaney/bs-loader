// @flow

const os = require('os')
const { exec, execSync } = require('child_process')
const { readFile, readFileSync } = require('fs')
/*:: import type { BsModuleFormat } from 'read-bsconfig' */

let bsbCommand
try {
  bsbCommand = require.resolve('bs-platform/bin/bsb.exe')
} catch (e) {
  bsbCommand = `bsb`
}

function isWSL() {
  const release = os.release()
  return release.substring(release.length - 'Microsoft'.length) === 'Microsoft'
}

const bsb =
  os.platform() === 'darwin'
    ? `script -q /dev/null ${bsbCommand} -make-world -color`
    : os.platform() === 'linux'
      ? isWSL()
        ? `${bsbCommand} -make-world` // Windows WSL
        : `script --return -qfc "${bsbCommand} -make-world -color" /dev/null` // Linux
      : `${bsbCommand} -make-world` // Windows Native and others.

const outputDir = 'lib'
const CWD = process.cwd()

const fileNameRegex = /\.(ml|re)$/
const es6ReplaceRegex = /(from\ "\.\.?\/.*)(\.js)("\;)/g
const commonJsReplaceRegex = /(require\("\.\.?\/.*)(\.js)("\);)/g
const getErrorRegex = /(File [\s\S]*?:\n|Fatal )[eE]rror: [\s\S]*?(?=ninja|\n\n|$)/g
const getSuperErrorRegex = /We've found a bug for you![\s\S]*?(?=ninja: build stopped)/g
const getWarningRegex = /((File [\s\S]*?Warning.+? \d+:)|Warning number \d+)[\s\S]*?(?=\[\d+\/\d+\]|$)/g

const utils = {
  transformSrc(moduleType /*: BsModuleFormat | 'js' */, src /*: string */) {
    const replacer =
      moduleType === 'es6' ? es6ReplaceRegex : commonJsReplaceRegex

    return src.replace(replacer, '$1$3')
  },

  processBsbError(err) {
    if (typeof err === 'string')
      return err.match(
        err.includes('-bs-super-errors') ? getSuperErrorRegex : getErrorRegex
      )

    if (err.message) return [err.message]

    return []
  },

  processBsbWarnings(output) {
    return output.match(getWarningRegex) || []
  }
}

/**
 * Runs `bsb` async
 */
function runBuild(cwd /*: string */ = CWD) /*: Promise<string> */ {
  return new Promise((resolve, reject) => {
    exec(bsb, { maxBuffer: Infinity, cwd }, (err, stdout, stderr) => {
      const output = `${stdout.toString()}\n${stderr.toString()}`
      if (err) {
        reject(output)
      } else {
        resolve(output)
      }
    })
  })
}

/**
 * Runs `bsb`
 */
function runBuildSync() {
  const output = execSync(bsb, { stdio: 'pipe' })

  return output.toString()
}

/*::
type Compilation = {
  src: ?string,
  warnings: string[],
  errors: Array<Error>
}
*/

const buildRuns /*: { [buildId: string]: Promise<string> } */ = {}

/**
 * Compiles a Reason file to JS
 */
function compileFile(
  buildDir /*: string */,
  moduleType /*: BsModuleFormat | 'js' */,
  path /*: string */,
  id /*: ?string */ = null
) /*: Promise<Compilation> */ {
  if (id && buildRuns[id] !== undefined) {
    buildRuns[id] = runBuild(buildDir)
  }

  const buildProcess = id ? buildRuns[id] : runBuild()

  return buildProcess
    .then(
      output =>
        new Promise((resolve, reject) => {
          readFile(path, (err, res) => {
            if (err) {
              resolve({
                src: undefined,
                warnings: [],
                errors: [err]
              })
            } else {
              const src = utils.transformSrc(moduleType, res.toString())

              resolve({
                src,
                warnings: utils.processBsbWarnings(output),
                errors: []
              })
            }
          })
        })
    )
    .catch(err => ({
      src: undefined,
      warnings: [],
      errors: utils.processBsbError(err)
    }))
}

/**
 * Compiles a Reason file to JS sync
 */
function compileFileSync(
  moduleType /*: BsModuleFormat | 'js' */,
  path /*: string */
) /*: string */ {
  try {
    runBuildSync()
  } catch (e) {
    throw utils.processBsbError(e.output.toString())
  }

  const res = readFileSync(path)
  return utils.transformSrc(moduleType, res.toString())
}

module.exports = {
  BSB: bsb,
  runBuild,
  runBuildSync,
  compileFile,
  compileFileSync
}
