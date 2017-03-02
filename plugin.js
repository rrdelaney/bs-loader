const { execFile } = require('child_process')
const bsb = require.resolve('bs-platform/bin/bsb')

const bsbMakeWorld = (compilation, callback) => {
  execFile(bsb, ['-make-world', '-clean-world'], (err, stdout, stderr) => {
    if (err) {
      callback(stdout, null)
    } else {
      callback(null, stdout)
    }
  })
}

class BsPlugin {
  apply (compiler) {
    compiler.plugin('run', bsbMakeWorld)
    compiler.plugin('run-watch', bsbMakeWorld)
  }
}

module.exports = BsPlugin
