const path = require('path')

module.exports = {
  entry: './src/print.re',
  output: {
    filename: 'out.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    rules: [
      {
        test: /\.(re|ml)$/,
        use: [
          {
            loader: 'bs-loader',
            options: {
              module: 'es6'
            }
          }
        ]
      }
    ]
  },

  resolve: {
    extensions: ['.re', '.ml', '.js']
  }
}
