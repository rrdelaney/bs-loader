const path = require('path')
const ReasonPlugin = require('../')

process.env.BABEL_ENV = 'development'

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'out.js',
    path: path.join(__dirname, 'build')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['react-app']
          }
        }
      },
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
    extensions: ['.js', '.json', '.re']
  },
  plugins: [
    new ReasonPlugin({
      sources: 'src',
      output: 'types'
    })
  ]
}
