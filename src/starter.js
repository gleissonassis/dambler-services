var UserBO                = require('./business/userBO');
var DAOFactory            = require('./daos/daoFactory');
var ModelParser           = require('./models/modelParser');
var JWTHelper             = require('./helpers/jwtHelper');
var UserHelper            = require('./helpers/userHelper');
var Promise               = require('promise');

module.exports = function() {
  var modelParser = new ModelParser();

  var userBO = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    modelParser: modelParser,
    jwtHelper: new JWTHelper(),
    userHelper: new UserHelper()
  });

  return {
    createAdminUser: function() {
      return new new Promise(function(resolve, reject) {
        return userBO.createUserWithoutValidations({
          name: 'Administrator',
          email: 'admin@dambler.com.br',
          password: '123456',
          role: 'admin',
          wallet: {
            coins: 10,
            averageValue: 0
          },
          confirmation: {
            key: 'CONFIRMATION_KEY',
            isConfirmed: false
          },
          internalKey: 'INTERNAL_KEY'
        })
        .then(resolve)
        .catch(function(error) {
          if (error.status === 409) {
            resolve();
          } else {
            reject(error);
          }
        });
      });
    },

    configureApplication: function() {
      var self = this;
      var chain = Promise.resolve();

      return chain
        .then(function() {
          return self.createAdminUser();
        });
    }
  };
};
