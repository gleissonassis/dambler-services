var util      = require('util');

module.exports = {
    mongoUrl : util.format('mongodb://%s/%s', process.env.DB_SERVER, process.env.DB_NAME),
    servicePort : process.env.PORT,
    isMongoDebug : false
};
