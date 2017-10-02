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

/**
 * Runs `bsb` async
 */
function runBuild(cwd /*: string */ = CWD) /*: Promise<void> */ {
  return new Promise((resolve, reject) => {
    exec(bsb, { maxBuffer: Infinity, cwd }, (err, stdout, stderr) => {
      if (err) {
        reject(`${stdout.toString()}\n${stderr.toString()}`)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Runs `bsb`
 */
function runBuildSync() {
  execSync(bsb, { stdio: 'pipe' })
}

function transformSrc(moduleType /*: BsModuleFormat */, src /*: string */) {
  const replacer = moduleType === 'es6' ? es6ReplaceRegex : commonJsReplaceRegex

  return src.replace(replacer, '$1$3')
}

const buildRuns /*: { [buildId: string]: Promise<void> } */ = {}

/**
 * Compiles a Reason file to JS
 */
function compileFile(
  buildDir /*: string */,
  moduleType /*: BsModuleFormat */,
  path /*: string */,
  id /*: ?string */ = null
) /*: Promise<string> */ {
  if (id && buildRuns[id] !== undefined) {
    buildRuns[id] = runBuild(buildDir)
  }

  const buildProcess = id ? buildRuns[id] : runBuild()

  return buildProcess.then(
    () =>
      new Promise((resolve, reject) => {
        readFile(path, (err, res) => {
          if (err) {
            reject(err)
          } else {
            const src = transformSrc(moduleType, res.toString())
            resolve(src)
          }
        })
      })
  )
}

/**
 * Compiles a Reason file to JS sync
 */
function compileFileSync(
  moduleType /*: BsModuleFormat */,
  path /*: string */
) /*: string */ {
  try {
    runBuildSync()
  } catch (e) {
    throw e.output.toString()
  }

  const res = readFileSync(path)
  return transformSrc(moduleType, res.toString())
}

module.exports = {
  BSB: bsb,
  runBuild,
  runBuildSync,
  compileFile,
  compileFileSync
}
