// @flow

/*::
export type BsDependency = string

export type BsRuleGenerator = {
  name: string,
  command: string
}

export type BsJsxVersion = boolean | number

export type BsReasonSpecs = {
  'react-jsx': BsJsxVersion
}

export type BsJsPostBuild = {
  cmd: string
}

export type BsModuleFormat =
  | 'commonjs'
  | 'amdjs'
  | 'amdjs-global'
  | 'es6'
  | 'es6-global'

export type BsPackageSpec =
  | BsModuleFormat
  | { module: BsModuleFormat, 'in-source': boolean }

export type BsConfig = {
  version: string,
  name: string,
  namespace: boolean,
  sources: any, // TODO: fill in this definition
  'bs-dependencies': BsDependency[],
  'bs-dev-dependencies': BsDependency[],
  generators: BsRuleGenerator[],
  'cut-generators': boolean,
  reason: BsReasonSpecs,
  'bsc-flags': string[],
  'ppx-flags': string[],
  'js-post-build': BsJsPostBuild,
  'package-specs': BsPackageSpec|BsPackageSpec[],
  ocamllex: string,
  ocamlyacc: string,
  menhir: string,
  entries: any, // TODO: fill in this definition
  'generate-merlin': boolean,
  'use-stdlib': boolean,
  'bs-external-includes': string[],
  refmt: string,
  'refmt-flags': string[],
  suffix: string
}
*/

const { readFile, readFileSync } = require('fs')
const path = require('path')
const JSON5 = require('json5')

let asyncConfigCache = {}

function readBsConfig(
  cwd /*: string */ = process.cwd(),
  enableCache /*: boolean */ = true
) /*: Promise<BsConfig> */ {
  if (asyncConfigCache[cwd] && enableCache) return asyncConfigCache[cwd]

  asyncConfigCache[cwd] = new Promise((resolve, reject) => {
    readFile(path.join(cwd, 'bsconfig.json'), (err, res) => {
      if (err) return reject(err)

      resolve(JSON5.parse(res.toString()))
    })
  })

  return asyncConfigCache[cwd]
}

let syncConfigCache = {}

function readBsConfigSync(
  cwd /*: string */ = process.cwd(),
  enableCache /*: boolean */ = true
) /*: BsConfig */ {
  if (syncConfigCache[cwd] && enableCache) return syncConfigCache[cwd]

  const content = readFileSync(path.join(cwd, 'bsconfig.json'))
  syncConfigCache[cwd] = JSON5.parse(content.toString())

  return syncConfigCache[cwd]
}

function clearCache() {
  asyncConfigCache = {}
  syncConfigCache = {}
}

module.exports = { readBsConfig, readBsConfigSync, clearCache }
