var path = require('path');
var fs = require('fs');
var debug = require('debug')('git:handler');

module.exports = function* () {
  debug('head');

  var git = this.git;
  if(!(yield git.delegate.shouldHandle({
    command: 'head',
    context: this
  }))) {
    this.status = 500;
    return;
  }

  var ok = yield git.exists(this.repo);
  if(!ok) {
    if(git.autoCreate) {
      yield git.create(this.repo);
    } else {
      this.status = 404;
      return;
    }
  }
  var file = path.join(git.resovle(), 'HEAD');
  if(fs.existsSync(file)) {
    this.body = fs.createReadStream(file);
  } else {
    this.status = 404;
  }
};
