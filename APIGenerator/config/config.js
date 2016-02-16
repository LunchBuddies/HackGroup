var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'apigenerator'
    },
    port: 3000,
    db: 'mongodb://localhost/apigenerator-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'apigenerator'
    },
    port: 3000,
    db: 'mongodb://localhost/apigenerator-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'apigenerator'
    },
    port: 3000,
    db: 'mongodb://localhost/apigenerator-production'
  }
};

module.exports = config[env];
