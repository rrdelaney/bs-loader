// @flow

const os = require('os')

let bsbCommand
try {
  bsbCommand = require.resolve('bs-platform/bin/bsb.exe')
} catch (e) {
  bsbCommand = `bsb`
}

module.exports = function getBsbCommand(options /*: string */) {
  return os.platform() === 'darwin'
    ? `script -q /dev/null ${bsbCommand} ${options} -color`
    : os.platform() === 'linux'
      ? `script --return -qfc "${bsbCommand} ${options} -color" /dev/null`
      : `${bsbCommand} ${options}`
}