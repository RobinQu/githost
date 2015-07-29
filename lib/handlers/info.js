var spawn = require('child_process').spawn;
// var Promise = require('bluebird');
// var OperationalError = Promise.OperationalError;
var through = require('through2');
var debug = require('debug')('git:handler');

function pack (s) {
  var n = (4 + s.length).toString(16);
  return Array(4 - n.length + 1).join('0') + n + s;
}

module.exports = function*() {
  debug(this.repo);

  this.assert(this.query.service, 400, 'service parameter required');
  var service = this.query.service.replace(/^git-/, '');
  this.assert(this.git.services.indexOf(service) > -1, 405, 'service not available');

  var git = this.git;
  this.assert(yield git.delegate.intercept({type: 'info', repo: this.repo}), 400, 'should not be intercepted');

  var ok = yield git.exists(this.repo);
  if(!ok) {
    if(git.autoCreate) {
      yield this.git.create(this.repo);
    } else {
      this.status = 404;
      return;
    }
  }

  var dup = through();
  dup.write(pack('# service=git-' + service + '\n'));
  dup.write('0000');

  var cmd = [ 'git-' + service, '--stateless-rpc', '--advertise-refs', git.resolve(this.repo) ];
  debug('run %s', cmd);
  var ps = spawn(cmd[0], cmd.slice(1));
  var ctx = this;
  ps.on('error', function (err) {
    debug(err);
    err.cmd = cmd.join(' ');
    ctx.throw(err);
  });
  ps.stdout.pipe(dup);

  this.set('content-type', 'application/x-git-' + service + '-advertisement');
  this.body = dup;
};
