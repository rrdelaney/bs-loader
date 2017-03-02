# bs-loader

> Bucklescript loader for Webpack

This works with both Reason and OCaml files, thanks to Bucklescript 1.5.

## Installation

```
npm install bs-loader
```

## [Example](https://github.com/rrdelaney/bs-loader/blob/master/example)

## Setting up Bucklescript

First create a `bsconfig.json` for Bucklescript:

```json
/* bsconfig.json */
{
  "name": "hello",
  "sources": [
    "src"
  ],
  "bs-dependencies": [
    "reason-js",
    "rehydrate"
  ],
  "reason": {
    "react-jsx": true
  }
}
```

We will also need `reason-js`, `rehydrate`, and `bs-platform`. Your `package.json` should look something like this:

```json
{
  "name": "reason-webpack",
  "private": true,
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "build": "webpack"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "bs-loader": "^1.0.0",
    "bs-platform": "^1.5.0",
    "reason-js": "0.0.16",
    "rehydrate": "git+https://github.com/reasonml/rehydrate.git",
    "webpack": "^2.2.1"
  },
  "dependencies": {
    "react": "^15.4.2",
    "react-dom": "^15.4.2"
  }
}

```

## Using the loader

To use the loader you must:
* Register the `.re` and `.ml` extensions with Webpack
* Configure `.re` and `.ml` to use the loader
* Use the BucklescriptPlugin

An example config would look like:

```js
// webpack.config.js
const path = require('path')
const BucklescriptPlugin = require('bs-loader/plugin')

module.exports = {
  // Entry file can be a Reason or OCaml file
  entry: './src/entry.re',
  output: {
    filename: 'out.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    rules: [
      // Set up Reason and OCaml files to use the loader
      { test: /.(re|ml)$/, use: 'bs-loader' },
    ]
  },
  resolve: {
    // Add .re and .ml to the list of extensions webpack recognizes
    extensions: ['.re', '.ml', '.js']
  },
  plugins: [
    // Register the BucklescriptPlugin
    new BucklescriptPlugin()
  ]
}
```
