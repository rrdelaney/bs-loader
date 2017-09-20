# reason-webpack-plugin

> `yarn add --dev reason-webpack-plugin`

### Installation

Add the plugin to your webpack config

```js
// webpack.config.js
const ReasonPlugin = require('reason-webpack-plugin')

module.exports = {
  // ...
  plugins: [
    new ReasonPlugin({ sources: 'src' })
  ]
}
```

ReasonPlugin will generate `.js.flow` files for you

```js
// @flow

import { add } from './my_reason_file'

// The `add` function is typed!
const value = add(100, 200)
```
