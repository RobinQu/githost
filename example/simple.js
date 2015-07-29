var githost = require('..');

var delegate = githost.HostDelegate.create({
  message: function (event, write, end) {
    console.log('xxx');
    write('Powered by GitHost');
    write('Good bye');
    end();
  }
});

githost.create({delegate: delegate}).listen(8080, function () {
  console.log('git server is up and running at port 8080');
});
