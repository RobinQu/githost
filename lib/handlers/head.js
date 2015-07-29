var path = require('path');
var fs = require('fs');
var debug = require('debug')('git:handler:head');

module.exports = function* () {
  debug(this.repo);

  var git = this.git;
  this.assert(yield git.delegate.intercept({repo: this.repo, type: 'head'}), 400, 'should not be intercepted');

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
