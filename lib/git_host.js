var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var spawn = require('child_process').spawn;
var debug = require('debug')('git:host');


var onexit = function (ps, cb) {
  var pending = 3;
  var code, sig;
  function onend () {
    if (--pending === 0) {
      cb(code, sig);
    }
  }
  ps.on('exit', function (c, s) {
    code = c;
    sig = s;
  });
  ps.on('exit', onend);
  ps.stdout.on('end', onend);
  ps.stderr.on('end', onend);
};


var GitHost = function (options) {
  options = _.defaults(options || {}, {
    autoCreate: true,
    checkout: false,
    root: '/tmp/repos'
  });
  debug('setup %j', options);
  this.root = path.resolve(options.root);
  this.services = ['upload-pack', 'receive-pack'];
  this.autoCreate = options.autoCreate;
  this.checkout = options.checkout;
  this.delegate = options.delegate || require('./git_host_delegate').create();
};
var proto = GitHost.prototype;

proto.resolve = function (repo) {
  return path.join(this.root, repo.group, repo.name);
};

proto.exists = function (repo, callback) {
  var self = this;
  return (new Promise(function (resolve) {
    fs.exists(self.resolve(repo), function (ok) {
      resolve(ok);
    });
  })).nodeify(callback);
};

proto.create = function (repo, callback) {
  debug('create');
  var p = this.resolve(repo) + '.git';
  if(!fs.existsSync(p)) {
    mkdirp.sync(p);
  }
  var ps = this.checkout ? spawn('git', ['init', p]) : spawn('git', ['init', '--bare', p]);
  var txt = '';
  ps.stderr.on('data', function (buf) {
    txt += buf;
  });
  return (new Promise(function (resolve, reject) {
    onexit(ps, function (code) {
      debug('exit %s for %s', code, p);
      if(code) {
        var e = new Error('git checkout error');
        e.stderr = txt;
        reject(e);
      } else {
        resolve();
      }
    });
  })).nodeify(callback);
};

module.exports = GitHost;
