var githost = require('..');

githost.repo().listen(8080, function () {
  console.log('git server is up and running at port 8080');
});
