var koa = require('koa');
var util = require('util');
var Router = require('koa-router');
// var path = require('path');

var GitHost = require('./git_host');
var handlers = require('./handlers');

var router = new Router();
router.get('/:group/:repo/info/refs', handlers.info);
router.get('/:group/:repo/info/HEAD', handlers.head);
router.post('/:group/:repo/git-:service', handlers.action);

var GitHostServer = function (options) {
  koa.call(this);
  var git = new GitHost(options);
  this.use(function *(next) {
    if(!this.git) {
      this.git = git;
    }
    if(this.params.group && this.params.repo) {
      this.repo = {
        name: this.params.repo,
        group: this.params.group
      };
    }
    yield next;
  });
  this.use(require('./middlewares/no_cache')());
  this.use(router.middleware());
};

util.inherits(GitHostServer, koa);

module.exports = GitHostServer;
