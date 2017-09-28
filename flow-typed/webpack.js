// @flow

declare module 'webpack' {
  declare export type WebpackLoaderThis = {
    async: () => (err: Error | null, res: string | null) => void,
    context: string,
    addContextDependency: (dep: string) => void,
    resourcePath: string,
    _compilation: { [key: string]: any },
    emitError: (err: Error) => void,
    emitWarning: (err: Error) => void
  }

  declare export type WebpackCompilerInstance = {
    plugin: (
      event: string,
      callback: (compilation: any, callback: () => void) => void | Promise<void>
    ) => void,
    context: string
  }
}
