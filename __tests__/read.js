const readBsConfig = require('../')

test('Read bsconfig from process.cwd()', () => {
  expect(readBsConfig()).rejects.toBeDefined()
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
