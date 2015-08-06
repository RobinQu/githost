var koa = require('koa');
var Router = require('koa-router');
var debug = require('debug')('git:repo');

var GitHost = require('./git_host');
var handlers = require('./handlers');

module.exports = function (app, options) {
  if(app && app.use) {//koa instance
    debug('create with koa app');
  } else {
    debug('create without koa app');
    options = app;
    app = koa();
  }
  options = options || {};

  var router = new Router();
  router.param('group', function *(group, next) {
    this.repo.group = group;
    yield next;
  });
  router.param('repo', function *(repo, next) {
    this.repo.name = repo;
    yield next;
  });
  router.use.apply(router, options.middlewares);
  router.get('/:group/:repo.git/info/refs', handlers.info);
  router.get('/:group/:repo.git/info/HEAD', handlers.head);
  router.post('/:group/:repo.git/git-:service', handlers.action);

  var git = options.githost || new GitHost(options);
  app.git = git;
  app.use(function *(next) {
    debug('%s %s', this.method, this.url);
    if(!this.git) {
      this.git = app.git;
    }
    this.repo = {};
    yield next;
  });
  app.use(require('./middlewares/no_cache')());
  app.use(router.middleware());
  return app;
};
