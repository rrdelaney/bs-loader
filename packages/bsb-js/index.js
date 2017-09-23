// @flow

const os = require('os')
const { exec, execSync } = require('child_process')

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
      : bsbCommand

const CWD = process.cwd()

function build(cwd /*: string */ = CWD) /*: Promise<void> */ {
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

function buildSync() {
  execSync(bsb, { stdio: 'pipe' })
}

module.exports = {
  BSB: bsb,
  build,
  buildSync
}
