var githost = require('..');
var Promise = require('bluebird');

var delegate = githost.HostDelegate.create({
  message: function (event, write, end) {
    console.log('xxx');
    write('Powered by GitHost');
    write('Good bye');
    end();
  },
  intercept: function (event) {
    if(event.repo.group === 'secrets') {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }
});

githost.create({delegate: delegate}).listen(8080, function () {
  console.log('git server is up and running at port 8080');
});
