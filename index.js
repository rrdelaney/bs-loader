const { writeFile } = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const glob = require('glob')
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

class GetTypedPlugin {
  constructor({ sources, output }) {
    this.output = output
    this.sources = sources
    this.chunkVersions = {}

    mkdirp.sync(output)
  }

  apply(compiler) {
    compiler.plugin('before-run', async (compiler, cb) => {
      const baseDir = path.join(compiler.context, this.sources)
      const files = await new Promise((resolve, reject) =>
        glob(`${baseDir}/*.js?(x)`, (err, matches) => {
          if (err) return reject(err)
          resolve(matches)
        })
      )

      const relativeFiles = files.map(f => path.relative(compiler.context, f))

      await Promise.all(relativeFiles.map(compile(baseDir, this.output)))

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
      cb()
    })
  }
}

module.exports = GetTypedPlugin
