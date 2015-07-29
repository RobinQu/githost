var Server = require('./server');

module.exports = {
  GitServer: Server,
  GitHost: require('./git_host'),
  HostDelegate: require('./git_host_delegate'),
  create: function (options) {
    return new Server(options);
  }
};
