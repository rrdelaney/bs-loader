// @flow

declare module 'webpack' {
  declare export type WebpackLoaderThis = {
    async: () => (err: Error | null, res: string | null) => void,
    context: string,
    addContextDependency: (dep: string) => void,
    resourcePath: string,
    _compilation: { [key: string]: any },
    emitError: (err: Error) => void
  }
}
