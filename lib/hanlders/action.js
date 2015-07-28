var spawn = require('child_process').spawn;
var zlib = require('zlib');
var through = require('through2');

var encodings = {
    'gzip': function() {return zlib.createGunzip(); },
    'deflate': function() {return zlib.createDeflate(); }
};


var headerRE = {
    'receive-pack': '([0-9a-fA-F]+) ([0-9a-fA-F]+)'
        + ' refs\/(heads|tags)\/(.*?)( |00|\u0000)'
        + '|^(0000)$'
    ,
    'upload-pack': '^\\S+ ([0-9a-fA-F]+)'
};


module.exports = function () {
  var service = this.params.service;
  this.assert(this.git.services.indexOf(service) > -1, 405, 'service not avaiable');
  this.set('content-type', 'application/x-git-' + service + '-result');

  var ctx = this;
  var git = this.git;
  var req = this.req;
  this.req.once('data', function (buf) {
    var data = buf.toString();
    var ops = data.match(new RegExp(headerRE[service], 'gi'));
    ops.forEach(function(op) {
      var m = op.match(new RegExp(headerRE[self.service]));
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
          git.emit('header', event);
      } else if (self.service === 'upload-pack') {
          event.commit = m[1];
          event.type = 'fetch';
          git.emit('header', { commit: event.commit});
      }
    });
  });

  // var reply = through(function (c) {
  //   return this.queue(c);
  // }, function () {
  //   this.queue(null);
  // });
  var reply = through();

  var cmd = [ 'git-' + service, '--stateless-rpc', git.resolve(this.repo) ];
  var ps = spawn(cmd[0], cmd.slice(1));
  ps.on('error', function (e) {
    e.cmd = cmd.join(' ');
    ctx.throw(e);
  });

  var decoder = encodings[this.get('content-encoding')];
  if(decoder) {
    req.pipe(decoder).pipe(ps.stdin);
  } else {
    req.pipe(ps.stdin);
  }

  ps.stdout.pipe(reply);
  this.body = reply;
};
