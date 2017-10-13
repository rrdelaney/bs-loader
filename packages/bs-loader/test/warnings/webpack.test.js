const webpack = require('webpack')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { exec } = require('child_process')

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

let bsbCommand
try {
  bsbCommand = require.resolve('bs-platform/bin/bsb.exe')
} catch (e) {
  bsbCommand = `bsb`
}

const bsb =
  os.platform() === 'darwin'
    ? `script -q /dev/null ${bsbCommand} -clean-world -color`
    : os.platform() === 'linux'
      ? `script --return -qfc "${bsbCommand} -clean-world -color" /dev/null`
      : `${bsbCommand} -clean-world`

it('runs', done => {
  exec(bsb, { maxBuffer: Infinity, cwd: __dirname }, (err, stdout, stderr) => {
    if(err) {
      done(err)
      return
    }

    webpack(baseConfig, (err, stats) => {
      expect(err).toBeNull()
      expect(stats.toJson().warnings.length).toBe(1)

      done()
    })
  })
})
