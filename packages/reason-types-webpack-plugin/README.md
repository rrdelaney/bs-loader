# reason-types-webpack-plugin

> `yarn add --dev reason-webpack-plugin`

### Installation

Add the plugin to your webpack config

```js
// webpack.config.js
const ReasonTypesPlugin = require('reason-types-webpack-plugin')

module.exports = {
  // ...
  plugins: [
    new ReasonTypesPlugin({ sources: 'src' })
  ]
}
```

ReasonTypesPlugin will generate `.js.flow` files for you

```js
// @flow

import { add } from './my_reason_file'

// The `add` function is typed!
const value = add(100, 200)
```
