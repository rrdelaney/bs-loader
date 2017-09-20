const { readFile, writeFile } = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const glob = require('glob')
const { default: flowgen } = require('reasonable-flowgen')
const { default: getTyped } = require('get-typed')

const getTypedOptions = {
  reason: true
}

const normalizeChunk = str => path.parse(str).name + '.re'

const processSource = (source, chunkName) =>
  source.replace(/(\[@@bs\.module ")([\w-]*)("\])/g, `$1./${chunkName}$3`)

const compile = (context, outputDir) => async chunkName => {
  const { printed } = await getTyped(chunkName, getTypedOptions)
  const { reason } = printed
  const [moduleName, _, _source] = reason
  const source = processSource(_source, path.relative(context, chunkName))
  const filename = path.join(outputDir, normalizeChunk(chunkName))

  await new Promise((resolve, reject) =>
    writeFile(filename, source, err => {
      if (err) return reject(err)
      resolve()
    })
  )

  return { filename, source }
}

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

class ReasonPlugin {
  constructor({ sources, output }) {
    this.output = output
    this.sources = sources
    this.chunkVersions = {}

    mkdirp.sync(output)
  }

  apply(compiler) {
    compiler.plugin('before-run', async (compiler, cb) => {
      const baseDir = path.join(compiler.context, this.sources)
      const jsFiles = await new Promise((resolve, reject) =>
        glob(`${baseDir}/*.js?(x)`, (err, matches) => {
          if (err) return reject(err)
          resolve(matches)
        })
      )

      const relativeJsFiles = jsFiles.map(f =>
        path.relative(compiler.context, f)
      )

      await Promise.all(relativeJsFiles.map(compile(baseDir, this.output)))

      cb()
    })

    compiler.plugin('emit', async (compilation, cb) => {
      const changedChunks = compilation.chunks
        .filter(chunk => {
          const oldVersion = this.chunkVersions[chunk.name]
          this.chunkVersions[chunk.name] = chunk.hash
          return chunk.hash !== oldVersion
        })
        .map(chunk => chunk.modules)
        .reduce((all, chunk) => all.concat(chunk), [])
        .map(module_ => [module_.context, module_.resource])
        .filter(
          ([context, resource]) =>
            resource.endsWith('.js') || resource.endsWith('.jsx')
        )

      await Promise.all(
        changedChunks.map(([context, resource]) =>
          compile(context, this.output)
        )
      )

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
