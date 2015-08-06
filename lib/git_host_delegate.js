var _ = require('lodash');
var debug = require('debug')('git:delegate');

var Delegate = function (methods) {
  debug('construct');
  _.extend(this, methods);
};
var proto = Delegate.prototype;

proto.intercept = function (git, event) {
  debug('intercept %j', event);
  return Promise.resolve({ok: true});
};

proto.message = function (git, event, write) {
  debug('message %j', event);
  write('Powered by GitHost');
};

proto.after = function (git, event, write, end) {
  debug('after ps %s', event.ps.pid);
  end();
};

Delegate.create = function (methods) {
  return new Delegate(methods);
};

module.exports = Delegate;
