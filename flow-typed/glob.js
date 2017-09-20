// @flow

declare module 'glob' {
  declare type GlobFn = {
    (
      sources: string,
      callback: (err: null | Error, matches: string[]) => void
    ): void,
    sync: (sources: string) => string[]
  }

  declare module.exports: GlobFn
}
