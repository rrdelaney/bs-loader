// @flow

declare module '@babel/core' {
  declare type BabelOptions = {
    plugins: string[],
  }

  declare type BabelOutput = {
    code: string,
  }

  declare export function transform(
    code: string,
    options: BabelOptions,
  ): BabelOutput
}
