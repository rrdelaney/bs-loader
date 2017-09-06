# read-bsconfig

Library for reading the bsconfig.json for BuckleScript

## Usage

```js
const readBsConfig = require('read-bsconfig')

// Read from the CWD
const myConf = readBsConfig()

// If the bsconfig is located somewhere else, pass it in as an arg
const otherConf = readBsConfig(__dirname)
```
