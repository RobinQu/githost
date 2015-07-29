var spawn = require('child_process').spawn;
var zlib = require('zlib');
var through = require('through2');
var debug = require('debug')('git:handler:action');
// var Buffer = require('buffer').Buffer;
var encode = require('git-side-band-message');

var encodings = {
    'gzip': function() {return zlib.createGunzip(); },
    'deflate': function() {return zlib.createDeflate(); }
};


var headerRE = {
    'receive-pack': '([0-9a-fA-F]+) ([0-9a-fA-F]+)'
        + ' refs\/(heads|tags)\/(.*?)( |00|\u0000)'
        + '|^(0000)$',
    'upload-pack': '^\\S+ ([0-9a-fA-F]+)'
};


var once = function (cb, ctx) {
  var called = false;
  return function () {
    if(cb && !called) {
      called = true;
      cb.apply(ctx || null, arguments);
    }
  };
};

module.exports = function *() {
  var service = this.params.service;
  debug('action %s for %s', service, this.repo);
  this.assert(this.git.services.indexOf(service) > -1, 405, 'service not avaiable');
  this.set('content-type', 'application/x-git-' + service + '-result');

  var ctx = this;
  var git = this.git;
  var req = this.req;


  var buffered = through().pause();
  var tmp = through();
  var decoder = encodings[this.get('content-encoding')];
  if(decoder) {
    req.pipe(decoder).pipe(tmp).pipe(buffered);
  } else {
    req.pipe(tmp).pipe(buffered);
  }

  //extract event data
  var objects = yield function (callback) {
    callback = once(callback);
    tmp.once('data', function (buf) {
      var data = buf.toString();
      debug('extract');
      var ops = data.match(new RegExp(headerRE[service], 'gi'));
      callback(null, ops);
    });
    tmp.once('error', callback);
    tmp.once('end', callback);
  };
  this.assert(objects && objects.length, 400, 'should have git objects');

  var run = function () {
    var cmd = ['git-' + service, '--stateless-rpc', git.resolve(ctx.repo)];
    debug('run %s', cmd.join(' '));
    var ps = spawn(cmd[0], cmd.slice(1));
    ps.on('error', function (e) {
      debug(e);
      e.cmd = cmd.join(' ');
      ctx.throw(e);
    });
    return ps;
  };

  for(var i = 0, len = objects.length; i < len; i++) {
    var m = objects[i].match(new RegExp(headerRE[service]));
    var event = {};
    if (service === 'receive-pack') {
      event.last = m[1];
      event.commit = m[2];
      var type;
      if (m[3] === 'heads') {
        type = 'branch';
        event.type = 'push';
      } else {
        type = 'version';
        event.type = 'tag';
      }
      event[type] = m[4];
    } else if (service === 'upload-pack') {
      event.commit = m[1];
      event.type = 'fetch';
    }
    if(event.type) {//once rejected all objects are desserted
      event.repo = ctx.repo;
      this.assert(yield git.delegate.intercept(event), 400, 'should not be intercepted');
    }
  }

  var ps = run();
  var reply = through(function (c, enc, callback) {
    var self = this;
    if (c.length === 4 && c.toString() === '0000') {
      git.delegate.message({type: 'reply', repo: this.repo}, function (message, skipLineEnding) {
        debug('write %s', message);
        message = skipLineEnding ? message : message + '\n';
        self.push(encode(message));
      }, function () {
        debug('reply end');
        callback(null, c);
      });
    } else {
      debug('pass');
      callback(null, c);
    }
  });
  // var reply = through();
  ps.stdout.pipe(reply);
  buffered.pipe(ps.stdin);
  buffered.resume();

  this.body = reply;
};
