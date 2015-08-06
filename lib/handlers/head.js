var path = require('path');
var fs = require('fs');
var debug = require('debug')('git:handler:head');

module.exports = function* () {
  debug(this.repo);

  var git = this.git;
  var event = {repo: this.repo, type: 'head', context: this};
  var predicate = yield git.delegate.intercept(git, event);
  if(!predicate.ok) {
    this.status = predicate.status;
    this.body = predicate.message;
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
  this.app.emit('git:head', event);
  var file = path.join(git.resovle(), 'HEAD');
  if(fs.existsSync(file)) {
    this.body = fs.createReadStream(file);
  } else {
    this.status = 404;
  }
};
