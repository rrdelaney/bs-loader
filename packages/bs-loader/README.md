# bs-loader [![Build Status](https://travis-ci.org/reasonml-community/bs-loader.svg?branch=master)](https://travis-ci.org/reasonml-community/bs-loader)
> Bucklescript loader for Webpack

---
**This library is in maintanence mode. Instead of using bs-loader we recommend
using bsb' new in-source builds in conjunction with .bs.js extensions:**

```json
// bcsconfig.json
{
  "package-specs": {
    "module": "commonjs",
    "in-source": true
  },
  "suffix": ".bs.js",
}
```

---
This works with both Reason and OCaml files

## Installation

```
npm install bs-loader
```

## [Example](https://github.com/reasonml-community/bs-loader/blob/master/examples)

## Setting up Bucklescript

First install `bs-platform` into the project:

```
$ npm i -D bs-platform
```

Create a `bsconfig.json` for Bucklescript:

```json
/* bsconfig.json */
{
  "name": "hello",
  "sources": [
    "src"
  ],
  "bs-dependencies": [
    "reason-react"
  ],
  "reason": {
    "react-jsx": 2
  }
}
```

We will also need `reason-react`, and `bs-platform`. You can install `bs-platform` globally and
use `npm link` to the link the binary, or install `bs-platform` as a devDependency.
Your `package.json` should look something like this:

```json
/* package.json */
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
    "reason-react": "0.1.3",
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

An example config would look like:

```js
// webpack.config.js
const path = require('path')

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
      { test: /\.(re|ml)$/, use: 'bs-loader' },
    ]
  },
  resolve: {
    // Add .re and .ml to the list of extensions webpack recognizes
    extensions: ['.re', '.ml', '.js']
  }
}
```

## Usage with Jest

`bs-loader` includes a transform for usage with Jest. This lets Jest run
Reason and OCaml files as tests. An example Jest configuration using `bs-loader`:

```
"jest": {
  "moduleFileExtensions": [
    "re",
    "js",
    "ml"
  ],
  "testMatch": [
    "**/src/*_test.re"
  ],
  "transform": {
    ".(re|ml)": "bs-loader"
  }
}
```

## Options

Most of these settings are inferred from your `bsconfig.json`. These are available
for manual override, but might go away in the future.

### `module`

To tell Webpack to load a module type that isn't JS (for example, `amd` or `goog`)
give the loader a `module` option. For example, to use AMD modules produced by Bucklescript,
use the config

```js
{ test: /\.(re|ml)$/, use: 'bs-loader?module=amd' }
```

### `inSource`

To use bs-loader with [bsb's in-souce builds](https://bucklescript.github.io/bucklescript/Manual.html#_in_source_build_support_since_1_9_0),
add the `inSource` option to your loader config:

```js
{
  test: /\.(re|ml)$/,
  use: {
    loader: 'bs-loader',
    options: {
      module: 'es6',
      inSource: true
    }
  }
}
```

### `cwd`

This option specifies what directory to run `bsb` from. For example, to
run `bsb` from the same directory as your webpack config, use:

```js
{
  test: /\.(re|ml)$/,
  use: {
    loader: 'bs-loader',
    options: {
     cwd: __dirname
    }
  }
}
```

### `showWarnings`

Controls whether `bsb` compile warnings are shown. Defaults to `true`.
