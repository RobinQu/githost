var Server = require('./server');

module.exports = {
  GitServer: Server,
  GitHost: require('./git_host'),
  create: function (options) {
    return new Server(options);
  }
};
