// @flow

const os = require('os')
/*:: import type { BsModuleFormat } from 'read-bsconfig' */

const fileNameRegex = /\.(ml|re)$/
const es6ReplaceRegex = /(from\ "\.\.?\/.*)(\.js)("\;)/g
const commonJsReplaceRegex = /(require\("\.\.?\/.*)(\.js)("\);)/g
const getErrorRegex = /(File [\s\S]*?:\n|Fatal )[eE]rror: [\s\S]*?(?=ninja|\n\n|$)/g
const getSuperErrorRegex = /We've found a bug for you![\s\S]*?(?=ninja: build stopped)/g
const getWarningRegex = /((File [\s\S]*?Warning.+? \d+:)|Warning number \d+)[\s\S]*?(?=\[\d+\/\d+\]|$)/g

function platform() /*: 'darwin' | 'linux' | 'wsl' | null */ {
  const isWSL = () => {
    const release = os.release()
    return (
      release.substring(release.length - 'Microsoft'.length) === 'Microsoft'
    )
  }

  if (os.platform() === 'darwin') return 'darwin'
  if (os.platform() === 'linux' && isWSL()) return 'wsl'
  if (os.platform() === 'linux') return 'linux'
  return null
}

function transformSrc(
  moduleType /*: BsModuleFormat | 'js' */,
  src /*: string */
) {
  const replacer = moduleType === 'es6' ? es6ReplaceRegex : commonJsReplaceRegex

  return src.replace(replacer, '$1$3')
}

function processBsbError(err /*: Error | string */) {
  if (typeof err === 'string') {
    return (err.match(
      err.includes('-bs-super-errors') ? getSuperErrorRegex : getErrorRegex
    ) || []
    ).map(e => new Error(e))
  } else if (err instanceof Error) {
    return [err]
  } else {
    return []
  }
}

function processBsbWarnings(output /*: string */) {
  return output.match(getWarningRegex) || []
}

module.exports = {
  platform,
  transformSrc,
  processBsbError,
  processBsbWarnings
}
