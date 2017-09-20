// @flow

const { readFile, writeFile } = require('fs')
const path = require('path')
const glob = require('glob')
const { default: flowgen } = require('reasonable-flowgen')
/*:: import type { WebpackCompilerInstance } from 'webpack' */

const getDts = (context, file) => {
  const dtsFile = path.join(context, 'lib', 'bs', file.replace('.re', '.d.ts'))

  return new Promise((resolve, reject) => {
    readFile(dtsFile, (err, contents) => {
      if (err) return reject(err)

      resolve(contents.toString())
    })
  })
}

const genFlowTypes = context => async chunkName => {
  try {
    const dtsSource = await getDts(context, chunkName)
    const flowSource =
      '// @flow\n\n' + flowgen.compileDefinitionString(dtsSource)
    const outputFile = path.join(context, chunkName.replace('.re', '.js.flow'))
    await new Promise((resolve, reject) => {
      writeFile(outputFile, flowSource, err => {
        if (err) return reject(err)

        resolve()
      })
    })
  } catch (e) {}
}

/*::
type PluginOptions = {
  sources: string
}
*/

class ReasonPlugin {
  /*:: sources: string */

  constructor({ sources } /*: PluginOptions */) {
    this.sources = sources
  }

  apply(compiler /*: WebpackCompilerInstance */) {
    compiler.plugin('emit', async (compilation, cb) => {
      const baseDir = path.join(compiler.context, this.sources)

      const reFiles = await new Promise((resolve, reject) =>
        glob(`${baseDir}/*.re`, (err, matches) => {
          if (err) return reject(err)
          resolve(matches)
        })
      )

      const relativeReFiles = reFiles.map(f =>
        path.relative(compiler.context, f)
      )

      await Promise.all(relativeReFiles.map(genFlowTypes(compiler.context)))

      cb()
    })
  }
}

module.exports = ReasonPlugin
