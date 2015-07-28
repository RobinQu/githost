var Server = require('./server');

module.exports = {
  GitServer: Server,
  GitHost: require('./git_host'),
  GitHostDelegate: require('./git_host_delegate'),
  create: function (options) {
    return new Server(options);
  }
};
