// @flow

const { readBsConfig } = require('read-bsconfig')
const path = require('path')
const { getOptions } = require('loader-utils')
const { compileFile, compileFileSync } = require('bsb-js')
/*:: import type { BsModuleFormat } from 'read-bsconfig' */
/*:: import type { WebpackLoaderThis } from 'webpack' */

const outputDir = 'lib'
const fileNameRegex = /\.(ml|re)$/

function jsFilePath(buildDir, moduleDir, resourcePath, inSource) {
  const mlFileName = resourcePath.replace(buildDir, '')
  const jsFileName = mlFileName.replace(fileNameRegex, '.js')

  if (inSource) {
    return path.join(buildDir, jsFileName)
  }

  return path.join(buildDir, outputDir, moduleDir, jsFileName)
}

/*:: type Options = { moduleDir: BsModuleFormat | 'js', inSource: boolean } */

function getBsConfigModuleOptions(buildDir) /*: Promise<Options> */ {
  return readBsConfig(buildDir).then(bsconfig => {
    if (!bsconfig) {
      throw new Error(`bsconfig not found in ${buildDir}`)
    }

    if (!bsconfig['package-specs'] || !bsconfig['package-specs'].length) {
      const options /*: Options */ = { moduleDir: 'js', inSource: false }
      return options
    }

    const moduleSpec = bsconfig['package-specs'][0]
    const moduleDir /*: BsModuleFormat */ =
      typeof moduleSpec === 'string' ? moduleSpec : moduleSpec.module
    const inSource =
      typeof moduleSpec === 'string' ? false : moduleSpec['in-source']

    const options /*: Options */ = { moduleDir, inSource }
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

      const inSourceBuild = options.inSource || bsconfig.inSource || false

      const compiledFilePath = jsFilePath(
        buildDir,
        moduleDir,
        this.resourcePath,
        inSourceBuild
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

module.exports.process = function process(
  src /*: string */,
  filename /*: string */
) {
  const moduleDir = 'js'
  const compiledFilePath = jsFilePath(process.cwd(), moduleDir, filename, false)

  return compileFileSync(moduleDir, compiledFilePath)
}
