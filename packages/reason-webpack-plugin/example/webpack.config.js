const path = require('path')
const ReasonPlugin = require('../')

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'out.js',
    path: path.join(__dirname, 'build')
  },
  plugins: [new ReasonPlugin()]
}
