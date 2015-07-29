var _ = require('lodash');
var debug = require('debug')('git:delegate');

var Delegate = function (methods) {
  debug('construct');
  _.extend(this, methods);
};
var proto = Delegate.prototype;

proto.intercept = function (event) {
  debug('intercept %j', event);
  return Promise.resolve(true);
};

proto.message = function (event, write, end) {
  debug('mesage %j', event);
  end();
};

Delegate.create = function (methods) {
  return new Delegate(methods);
};

module.exports = Delegate;
