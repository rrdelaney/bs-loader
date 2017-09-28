const webpack = require('webpack')
const path = require('path')
const fs = require('fs')

const output = path.join(__dirname, 'output', 'webpack')
const loader = path.join(__dirname, '..', '..')

const baseConfig = {
  entry: path.join(__dirname, 'fixtures/index.re'),
  module: {
    rules: [
      {
        test: /\.(re|ml)$/,
        use: {
          loader,
          options: {
            cwd: __dirname
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.re', '.ml', '.js']
  },
  output: {
    path: output,
    libraryTarget: 'commonjs2'
  }
}

it('runs', done => {
  webpack(baseConfig, (err, stats) => {
    expect(err).toBeNull()
    expect(stats.toJson().warnings.length).toBe(1)

    done()
  })
})
