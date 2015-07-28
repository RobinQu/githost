var debug = require('debug')('git:middleware:nocache');

module.exports = function () {
  return function *(next) {
    debug('set');
    this.set('expires', 'Fri, 01 Jan 1980 00:00:00 GMT');
    this.set('pragma', 'no-cache');
    this.set('cache-control', 'no-cache, max-age=0, must-revalidate');
    yield next;
  };
};
