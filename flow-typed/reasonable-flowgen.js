// @flow

declare module 'reasonable-flowgen' {
  declare type FlowgenCompiler = {
    compileDefinitionFile(filename: string): string,
    compileDefinitionString(src: string): string
  }

  declare module.exports: {
    default: FlowgenCompiler
  }
}
