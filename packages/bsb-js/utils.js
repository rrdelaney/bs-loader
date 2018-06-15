// @flow

const os = require('os')
/*:: import type { BsModuleFormat } from 'read-bsconfig' */

const fileNameRegex = /\.(ml|re)$/
const es6ReplaceRegex = /(from\ "\.\.?\/.*?)(\.bs\.js|\.js)("\;)/g
const commonJsReplaceRegex = /(require\("\.\.?\/.*?)(\.bs\.js|\.js)("\);)/g
const getErrorRegex = /(File [\s\S]*?:\r?\n|Fatal )[eE]rror: [\s\S]*?(?=ninja|\r?\n\r?\n|$)/g
const packageNotFoundRegex = /Package not found[\s\S]*?:?\r?\n[\s\S]*?[eE]rror:\s?[\s\S]*/g
const getSuperErrorRegex = /We've found a bug for you![\s\S]*?(?=ninja: build stopped)/g
const getWarningRegex = /((File [\s\S]*?Warning.+? \d+:)|Warning number \d+)[\s\S]*?(?=\[\d+\/\d+\]|$)/g
const errorRegexes = [getSuperErrorRegex, getErrorRegex, packageNotFoundRegex]

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
  src /*: string */,
) {
  const replacer = moduleType === 'es6' ? es6ReplaceRegex : commonJsReplaceRegex

  return src.replace(replacer, '$1$3')
}

// This function is only ever called if an error has been caught. We try to
// process said error according to known formats, but we default to what we
// got as an argument if they don't match. This way we always throw an error,
// thus avoiding successful builds if something has gone wrong.
function processBsbError(err /*: Error | string */) /*: Error[] */ {
  if (typeof err === 'string') {
    const errors = errorRegexes
    // $FlowIssue: err is definitely a string
      .map((r /*: RegExp */) => err.match(r))
      .reduce((a, s) => a.concat(s), [])
      .filter(x => x)

    return (errors.length > 0 ? errors : [err]).map(e => new Error(e))
  } else {
    return [err]
  }
}

function processBsbWarnings(output /*: string */) {
  return output.match(getWarningRegex) || []
}

module.exports = {
  platform,
  transformSrc,
  processBsbError,
  processBsbWarnings,
}
