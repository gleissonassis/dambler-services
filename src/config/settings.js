var util      = require('util');
var logger    = require('./logger');
var merge     = require('deepmerge');


var privateConfig = {};

try {
  logger.info('Trying to read the private settings file');
  privateConfig = require('./privateConfig');
} catch (e) {
  logger.warn('There is no private settings file so the default configurations will be apllied');
}

var defaultConfig = {
    mongoUrl : util.format('mongodb://%s/%s',
                      process.env.DB_SERVER || 'localhost',
                      process.env.DB_NAME   || 'dambler-services'),
    servicePort : process.env.PORT || 5000,
    isMongoDebug : true,
    jwt: {
      secret: 'secret',
      expiresIn: '1h'
    }
};

module.exports = merge(defaultConfig, privateConfig);
