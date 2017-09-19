// @flow

opaque type WebpackCompilation = { [key: string]: any }

declare module 'webpack' {
  declare export type WebpackLoaderThis = {
    async: () => (err: Error | null, res: string | null) => void,
    context: string,
    addContextDependency: (dep: string) => void,
    resourcePath: string,
    _compilation: WebpackCompilation,
    emitError: (err: Error) => void
  }
}
