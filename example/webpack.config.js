const path = require('path')
const BucklescriptPlugin = require('bs-loader/plugin')

module.exports = {
  entry: './src/print.re',
  output: {
    filename: 'out.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    rules: [
      { test: /.(re|ml)$/, use: 'bs-loader' },
    ]
  },
  resolve: {
    extensions: ['.re', '.ml', '.js']
  },
  plugins: [
    new BucklescriptPlugin()
  ]
}
