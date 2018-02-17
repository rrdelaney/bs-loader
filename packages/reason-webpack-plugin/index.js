// @flow

const bsb = require('bsb-js')
/*:: import type { WebpackCompilerInstance } from 'webpack' */

class ReasonPlugin {
  apply(compiler /*: WebpackCompilerInstance */) {
    compiler.plugin('before-compile', async (compilationParams, cb) => {
      await bsb.runBuild(process.cwd())
      cb()
    })
  }
}

module.exports = ReasonPlugin
