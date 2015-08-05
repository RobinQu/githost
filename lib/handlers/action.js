var spawn = require('child_process').spawn;
var zlib = require('zlib');
var through = require('through2');
var debug = require('debug')('git:handler:action');
var _ = require('lodash');
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

var getRef = function (header) {
  if(header.type === 'push') {
    return 'refs/heads/' + header.branch;
  }
  if(header.type === 'tag') {
    return 'refs/tags' + header.version;
  }
};

module.exports = function *() {
  var service = this.params.service;
  debug('action %s for %j', service, this.repo);
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

  var headers = [];
  for(var i = 0, len = objects.length; i < len; i++) {
    var m = objects[i].match(new RegExp(headerRE[service]));
    var header = {context: this};
    if (service === 'receive-pack') {
      header.last = m[1];
      header.commit = m[2];
      var type;
      if (m[3] === 'heads') {
        type = 'branch';
        header.type = 'push';
      } else {
        type = 'version';
        header.type = 'tag';
      }
      header[type] = m[4];
    } else if (service === 'upload-pack') {
      header.commit = m[1];
      header.type = 'fetch';
    }
    if(header.type) {//once rejected all objects are desserted
      header.ref = getRef(header);
      headers.push(header);
      var event = _.clone(header);
      event.repo = ctx.repo;
      event.context = this;
      this.app.emit('git:header', event);
      var predicate = yield git.delegate.intercept(event);
      if(!predicate.ok) {
        this.status = predicate.status;
        this.body = predicate.message;
        return;
      }
    }
  }

  var ps = run();
  var psEvent = {
    ps: ps,
    type: 'ps',
    repo: this.repo,
    headers: headers,
    context: this
  };
  this.app.emit('git:ps:start', psEvent);
  var write = function (s) {
    return function (message, skipLineEnding) {
      debug('write %s', message);
      message = skipLineEnding ? message : message + '\n';
      s.push(encode(message));
    };
  };
  var reply = through(function (c, enc, callback) {
    if (c.length === 4 && c.toString() === '0000') {//delay the signal for ending
      git.delegate.message({type: 'reply', repo: this.repo}, write(this));
      callback();
    } else {
      debug('pass');
      callback(null, c);
    }
  }, function (cb) {
    ctx.app.emit('git:ps:finish', psEvent);
    var self = this;
    git.delegate.after(psEvent, write(this), function () {
      debug('reply ends');
      self.push(new Buffer('0000'));
      self.push(null);
      cb.apply(null, arguments);
    });
  });
  ps.stdout.pipe(reply);
  var throwUp = ctx.throw.bind(ctx);
  reply.on('error', throwUp);
  ps.on('error', throwUp);
  buffered.pipe(ps.stdin);
  buffered.resume();
  this.body = reply;
};
