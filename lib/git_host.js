var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var spawn = require('child_process').spawn;
var debug = require('debug')('git:host');
// var rmdir = require('rmdir');

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
  return path.join(this.root, repo.group, repo.name) + '.git';
};

proto.exists = function (repo, callback) {
  var self = this;
  return (new Promise(function (resolve) {
    fs.exists(self.resolve(repo), function (ok) {
      resolve(ok);
    });
  })).nodeify(callback);
};

proto.listRepo = function (group, callback) {
  var self = this;
  return (new Promise(function (resolve, reject) {
    var groupPath = path.join(self.root, group);
    fs.readdir(groupPath, function (e, files) {
      if(e) {
        return reject(e);
      }
      var repos = _.filter(files, function (file) {
        return fs.statSync(path.join(groupPath, file)).isDirectory();
      });
      resolve(repos);
    });
  })).nodeify(callback);
};

proto.listGroup = function (callback) {
  var self = this;
  return (new Promise(function (resolve, reject) {
    fs.readdir(self.root, function (e, files) {
      if(e) {
        return reject(e);
      }
      var repos = _.filter(files, function (file) {
        return fs.statSync(path.join(self.root, file)).isDirectory();
      });
      resolve(repos);
    });
  })).nodeify(callback);
};


proto.remove = function (repo, callback) {
  var self = this;
  return (new Promise(function (resolve, reject) {
    var rm = spawn('rm', ['-rf', self.resolve(repo)]);
    var stderr = '';
    rm.stderr.on('error', function (data) {
      stderr += data;
    });
    rm.once('close', function (code) {
      if(code) {
        var e = new Error('rm error');
        e.stderr = stderr;
        return reject(e);
      }
      resolve();
    });
  })).nodeify(callback);
};

proto.create = function (repo, callback) {
  debug('create');
  var p = this.resolve(repo);
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
