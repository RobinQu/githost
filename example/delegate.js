var githost = require('..');
var Promise = require('bluebird');
var util = require('util');

var delegate = githost.HostDelegate.create({
  message: function (event, write) {
    write('Powered by GitHost');
  },
  intercept: function (event) {
    if(event.repo.group === 'secrets') {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  },
  after: function (event, write, end) {
    write(util.format('End for repo %j', event.repo));
    end();
  }
});

githost.create({delegate: delegate}).listen(8080, function () {
  console.log('git server is up and running at port 8080');
});
