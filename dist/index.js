'use strict';

var readBsConfig = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var cwd = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : process.cwd();
    var content;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return new Promise(function (resolve, reject) {
              readFile(path.join(cwd, 'bsconfig.json'), function (err, res) {
                if (err) return reject(err);

                resolve(res);
              });
            });

          case 2:
            content = _context.sent;
            return _context.abrupt('return', JSON5.parse(content.toString()));

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function readBsConfig() {
    return _ref.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var _require = require('fs'),
    readFile = _require.readFile,
    readFileSync = _require.readFileSync;

var path = require('path');
var JSON5 = require('json5');

function readBsConfigSync() {
  var cwd = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : process.cwd();

  var content = readFileSync(path.join(cwd, 'bsconfig.json'));

  return JSON5.parse(content.toString());
}

module.exports = { readBsConfig: readBsConfig, readBsConfigSync: readBsConfigSync };
