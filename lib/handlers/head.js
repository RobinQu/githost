var path = require('path');
var fs = require('fs');
var debug = require('debug')('git:handler');

module.exports = function* () {
  debug('head');
  var ok = yield this.git.exists(this.repo);
  if(!ok) {
    if(this.git.autoCreate) {
      yield this.git.create(this.repo);
    } else {
      this.status = 404;
      return;
    }
  }
  var file = path.join(this.git.resovle(), 'HEAD');
  if(fs.existsSync(file)) {
    this.body = fs.createReadStream(file);
  } else {
    this.status = 404;
  }
};
