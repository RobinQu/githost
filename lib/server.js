var koa = require('koa');
var util = require('util');
var Router = require('koa-router');
var debug = require('debug')('git:server');
// var path = require('path');

var GitHost = require('./git_host');
var handlers = require('./handlers');

var router = new Router();
router.param('group', function *(group, next) {
  this.repo.group = group;
  yield next;
});
router.param('repo', function *(repo, next) {
  this.repo.name = repo;
  yield next;
});

router.get('/:group/:repo/info/refs', handlers.info);
router.get('/:group/:repo/info/HEAD', handlers.head);
router.post('/:group/:repo/git-:service', handlers.action);

var GitServer = function (options) {
  koa.call(this);
  var git = new GitHost(options);
  this.use(function *(next) {
    debug('%s %s', this.method, this.url);
    if(!this.git) {
      this.git = git;
    }
    this.repo = {};
    yield next;
  });
  this.use(require('./middlewares/no_cache')());
  this.use(router.middleware());
};

util.inherits(GitServer, koa);

module.exports = GitServer;
