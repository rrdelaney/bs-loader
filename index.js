const { writeFile } = require('fs')
const path = require('path')

const getTyped = require('get-typed')

const getTypedOptions = {
  reason: true
}

const normalizeChunk = str => str + '.re'

const compile = outputDir => async chunkName => {
  const { printed } = await getTyped(chunkName, getTypedOptions)
  const { reason } = printed
  const outputFile = path.join(outputDir, normalizeChunk(chunkName))

  await writeFile(outputFile, reason, err => {
    if (err) return reject(err)
    resolve()
  })
}

class GetTypedPlugin {
  constructor({ output }) {
    this.output = output
  }

  apply(compiler) {
    compiler.plugin('before-compile', (params, cb) => {
      // const compilation = Promise.all(changedChunks.map(compile(this.output)))
    })
  }
}

module.exports = GetTypedPlugin
