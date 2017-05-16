const path = require('path')

module.exports = {
  entry: './src/print.re',
  output: {
    filename: 'out.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    rules: [
      { test: /\.(re|ml)$/, use: './bs-loader' },
    ]
  },
  resolve: {
    extensions: ['.re', '.ml', '.js']
  }
}
