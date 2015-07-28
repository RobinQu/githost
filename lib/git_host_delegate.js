var _ = require('lodash');

var Delegate = function (methods) {
  _.extend(this, methods);
};


Delegate.create = function (methods) {
  methods = _.defaults(methods || {}, {
    shouldHandle: function () {
      return Promise.resolve(true);
    }

  });
  return new Delegate(methods);
};


module.exports = Delegate;
