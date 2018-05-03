// @flow

const { readBsConfig } = require('read-bsconfig')
const path = require('path')
const { getOptions } = require('loader-utils')
const { compileFile, compileFileSync } = require('bsb-js')
/*:: import type { BsModuleFormat } from 'read-bsconfig' */
/*:: import type { WebpackLoaderThis } from 'webpack' */

const outputDir = 'lib'
const fileNameRegex = /\.(ml|re)$/

function jsFilePath(buildDir, moduleDir, resourcePath, inSource, bsSuffix) {
  const mlFileName = resourcePath.replace(buildDir, '')
  const jsFileName = mlFileName.replace(fileNameRegex, bsSuffix)

  if (inSource) {
    return path.join(buildDir, jsFileName)
  }

  return path.join(buildDir, outputDir, moduleDir, jsFileName)
}

/*:: type Options = { moduleDir: BsModuleFormat | 'js', inSource: boolean, suffix: string } */

function getBsConfigModuleOptions(buildDir) /*: Promise<Options> */ {
  return readBsConfig(buildDir).then(bsconfig => {
    if (!bsconfig) {
      throw new Error(`bsconfig not found in ${buildDir}`)
    }

    const bsSuffix = bsconfig.suffix
    const suffix = typeof bsSuffix === 'string' ? bsSuffix : '.js'

    if (!bsconfig['package-specs'] || !bsconfig['package-specs'].length) {
      const options /*: Options */ = {
        moduleDir: 'js',
        inSource: false,
        suffix
      }
      return options
    }

    const packageSpecs = bsconfig['package-specs']
    const moduleSpec =
      packageSpecs instanceof Array ? packageSpecs[0] : packageSpecs
    const moduleDir /*: BsModuleFormat */ =
      typeof moduleSpec === 'string' ? moduleSpec : moduleSpec.module
    const inSource =
      typeof moduleSpec === 'string' ? false : moduleSpec['in-source']

    const options /*: Options */ = { moduleDir, inSource, suffix }
    return options
  })
}

module.exports = function loader() {
  const options = getOptions(this) || {}
  const buildDir = options.cwd || process.cwd()
  const callback = this.async()
  const showWarnings =
    options.showWarnings !== undefined ? options.showWarnings : true

  this.addContextDependency(this.context)

  getBsConfigModuleOptions(buildDir)
    .then(bsconfig => {
      const moduleDir = bsconfig.moduleDir
      const bsSuffix = bsconfig.suffix

      const inSourceBuild = options.inSource || bsconfig.inSource || false

      const compiledFilePath = jsFilePath(
        buildDir,
        moduleDir,
        this.resourcePath,
        inSourceBuild,
        bsSuffix
      )

      return compileFile(buildDir, moduleDir, compiledFilePath)
    })
    .then(({ src, warnings, errors }) => {
      if (showWarnings) {
        warnings.forEach(message => {
          this.emitWarning(new Error(message))
        })
      }

      if (errors.length > 0) {
        for (let i = 0; i < errors.length - 1; ++i) {
          this.emitError(errors[i])
        }

        callback(errors[errors.length - 1], null)
      } else {
        callback(null, src || '')
      }
    })
}

/*:: declare var c: WebpackLoaderThis; module.exports.call(c) */

module.exports.process = function bsLoaderProcess(
  src /*: string */,
  filename /*: string */
) {
  const moduleDir = 'js'
  const compiledFilePath = jsFilePath(
    process.cwd(),
    moduleDir,
    filename,
    false,
    '.js'
  )

  return compileFileSync(moduleDir, compiledFilePath)
}
