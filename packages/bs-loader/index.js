// @flow

const { readBsConfig } = require('read-bsconfig')
const path = require('path')
const { getOptions } = require('loader-utils')
const { compileFile, compileFileSync } = require('bsb-js')
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

function getBsConfigModuleOptions(buildDir) {
  return readBsConfig(buildDir).then(bsconfig => {
    if (!bsconfig) {
      throw new Error(`bsconfig not found in ${buildDir}`)
    }

    if (!bsconfig['package-specs'] || !bsconfig['package-specs'].length) {
      return { module: 'js', inSource: false }
    }

    const moduleSpec = bsconfig['package-specs'][0]
    const moduleDir =
      typeof moduleSpec === 'string' ? moduleSpec : moduleSpec.module
    const inSource =
      typeof moduleSpec === 'string' ? false : moduleSpec['in-source']

    return { moduleDir, inSource }
  })
}

module.exports = function loader() {
  const options = getOptions(this) || {}
  const buildDir = options.cwd || process.cwd()
  const callback = this.async()

  this.addContextDependency(this.context)

  getBsConfigModuleOptions(buildDir).then(bsconfig => {
    const moduleDir = options.module || bsconfig.moduleDir || 'js'
    const inSourceBuild = options.inSource || bsconfig.inSource || false
    const showWarnings =
      options.showWarnings !== undefined ? options.showWarnings : true

    const compiledFilePath = jsFilePath(
      buildDir,
      moduleDir,
      this.resourcePath,
      inSourceBuild
    )

    compileFile(
      buildDir,
      moduleDir,
      compiledFilePath
    ).then(({ src, warnings, errors }) => {
      if (showWarnings) {
        warnings.forEach(message => {
          this.emitWarning(new Error(message))
        })
      }

      errors.slice().forEach(message => {
        this.emitError(message)
      })

      callback(null, src || '')
    })
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
