const { readBsConfig, readBsConfigSync } = require('../')

test('Read bsconfig from process.cwd()', () => {
  expect(readBsConfig()).rejects.toBeDefined()
  expect()
})

test('Read bsconfig from __dirname', async () => {
  const bsConfig = await readBsConfig(__dirname)

  expect(bsConfig).toEqual({
    name: 'reason-scripts',
    sources: ['src'],
    'bs-dependencies': ['reason-react', 'bs-jest'],
    reason: {
      'react-jsx': 2
    },
    'bsc-flags': ['-bs-super-errors']
  })
})

test('Read bsconfig from __dirname synchronously', () => {
  const bsConfig = readBsConfigSync(__dirname)

  expect(bsConfig).toEqual({
    name: 'reason-scripts',
    sources: ['src'],
    'bs-dependencies': ['reason-react', 'bs-jest'],
    reason: {
      'react-jsx': 2
    },
    'bsc-flags': ['-bs-super-errors']
  })
})

test('Cache should return same object for async reads', () => {
  let bs1 = readBsConfig(__dirname)
  let bs2 = readBsConfig(__dirname)

  expect(bs1).toBe(bs2)
})

test('Cache should return same rejected promise', () => {
  let bs1 = readBsConfig()
  let bs2 = readBsConfig()

  expect(bs1).toBe(bs2)
})

test('Cache can be disabled for async reads', () => {
  let bs1 = readBsConfig(__dirname, false)
  let bs2 = readBsConfig(__dirname, false)

  expect(bs1).not.toBe(bs2)
})

test('Cache should return same object for sync reads', () => {
  let bs1 = readBsConfigSync(__dirname)
  let bs2 = readBsConfigSync(__dirname)

  expect(bs1).toBe(bs2)
})

test('Cache can be disabled for sync reads', () => {
  let bs1 = readBsConfigSync(__dirname, false)
  let bs2 = readBsConfigSync(__dirname, false)

  expect(bs1).not.toBe(bs2)
})
