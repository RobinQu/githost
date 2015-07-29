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

proto.message = function (event, write) {
  debug('message %j', event);
  write('Powered by GitHost');
};

proto.after = function (event, write, end) {
  debug('after ps %s', event.ps.pid);
  end();
};

Delegate.create = function (methods) {
  return new Delegate(methods);
};

module.exports = Delegate;
