// @flow

const os = require('os')
const { exec, execSync } = require('child_process')
const { readFile, readFileSync } = require('fs')
const utils = require('./utils')
/*:: import type { BsModuleFormat } from 'read-bsconfig' */

let bsbCommand;
const bsbLocations = ['.bin/bsb', 'bs-platform/bin/bsb.exe'];
for (var i = 0; i < bsbLocations.length; ++i) {
  try {
    bsbCommand = require.resolve(bsbLocations[i]);
    break;
  } catch (e) {
  }
}
bsbCommand = bsbCommand || `bsb`;


const bsb = (() => {
  switch (utils.platform()) {
    case 'darwin':
      return `script -q /dev/null ${bsbCommand} -make-world -color`
    case 'linux':
      return `script --return -qfc "${bsbCommand} -make-world -color" /dev/null`
    case 'wsl':
      return `${bsbCommand} -make-world`
    default:
      return `${bsbCommand} -make-world`
  }
})()

/** Runs `bsb` async */
function runBuild(cwd /*: string */) /*: Promise<string> */ {
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

/** Runs `bsb` */
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

/** Compiles a Reason file to JS */
function compileFile(
  buildDir /*: string */,
  moduleType /*: BsModuleFormat | 'js' */,
  path /*: string */,
  id /*: ?string */ = null
) /*: Promise<Compilation> */ {
  if (id && buildRuns[id] !== undefined) {
    buildRuns[id] = runBuild(buildDir)
  }

  const buildProcess = id ? buildRuns[id] : runBuild(buildDir)

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

/** Compiles a Reason file to JS sync */
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
