// @flow

type BsDependency = string

type BsRuleGenerator = {
  name: string,
  command: string
}

type BsJsxVersion = boolean | number

type BsReasonSpecs = {
  'react-jsx': BsJsxVersion
}

type BsJsPostBuild = {
  cmd: string
}

type BsModuleFormat =
  | 'commonjs'
  | 'amdjs'
  | 'amdjs-global'
  | 'es6'
  | 'es6-global'

type BsPackageSpec =
  | BsModuleFormat
  | { module: BsModuleFormat, 'in-source': boolean }

type BsConfig = {
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
  'package-specs': BsPackageSpec[],
  ocamllex: string,
  ocamlyacc: string,
  menhir: string,
  entries: any, // TODO: fill in this definition
  'generate-merlin': boolean,
  'use-stdlib': boolean,
  'bs-external-includes': string[],
  refmt: string,
  'refmt-flags': string[]
}

declare module 'read-bsconfig' {
  declare export function readBsConfig(cwd?: string): Promise<BsConfig>
}
