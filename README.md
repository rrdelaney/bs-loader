# read-bsconfig

Library for reading the bsconfig.json for BuckleScript

## Usage

```js
const { readBsConfig, readBsConfigSync } = require('read-bsconfig')

// Read from the CWD
const myConf = readBsConfig()

// If the bsconfig is located somewhere else, pass it in as an arg
const otherConf = readBsConfig(__dirname)

// A bsconfig for a given path will be cached. This can be turned off
// by passing a second parameter as false
const notCachedConf = readBsConfig(__dirname, false)

// You can also read a config sync
// It has a the same arguments
const mySyncConf = readBsConfigSync()
```
