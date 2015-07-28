var path = require('path');
// var Promise = require('bluebird');
var fs = require('fs');

var GitHost = function (options) {
  this.root = path.resolve(options.root);
  this.services = [ 'upload-pack', 'receive-pack' ];
};
var proto = GitHost.prototype;

proto.resolve = function (repo) {
  return path.join(this.root, repo.group, repo.name);
};

proto.exists = function (repo, callback) {
  fs.exists(this.resolve(repo), function (ok) {
    if(callback) {
      callback(null, ok);
    }
  });
};

module.exports = GitHost;
