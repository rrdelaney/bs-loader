const {process: processJest} = require('../../index.js')

test('bs-loader compiles ES modules to CommonJS for Jest', () => {
  const jsSource = processJest('', './fixtures/adder.re', __dirname)

  const fakeAdd = jest.fn().mockImplementation((x, y) => x + y)
  const fakeRequire = jest.fn().mockImplementation(() => ({
    add: fakeAdd,
  }))

  const oldRequire = require
  require = fakeRequire

  const evalSource = () => eval(jsSource)
  expect(evalSource).not.toThrow()
  expect(fakeRequire).toHaveBeenCalledWith('./add.js')
  expect(fakeAdd).toHaveBeenCalled()

  require = oldRequire
})
