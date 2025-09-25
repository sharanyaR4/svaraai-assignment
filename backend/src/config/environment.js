const config = {
  development: {
    mongodb: process.env.MONGODB_URI || 'mongodb://localhost:27017/svaraai-tasks-dev',
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
  },
  production: {
    mongodb: process.env.MONGODB_URI,
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    clientUrl: process.env.CLIENT_URL
  },
  test: {
    mongodb: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/svaraai-tasks-test',
    port: process.env.PORT || 5001,
    jwtSecret: process.env.JWT_SECRET || 'test_secret',
    jwtExpire: '1h',
    clientUrl: 'http://localhost:3000'
  }
};

const environment = process.env.NODE_ENV || 'development';

module.exports = config[environment];