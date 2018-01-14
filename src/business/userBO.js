var Promise         = require('promise');
var md5             = require('../helpers/md5');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var userDAO = dependencies.userDAO;
  var jwtHelper = dependencies.jwtHelper;
  var modelParser = dependencies.modelParser;

  return {
    currentUser: {},

    setCurrentUser: function(currentUser) {
      this.currentUser = currentUser;
    },

    userIsAdministrator: function(user) {
      return user && user.role === 'admin';
    },

    clear: function() {
      return userDAO.clear();
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        filter.isEnabled = true;
        logger.info('Listing all users by filter ', filter);
        userDAO.getAll(filter)
          .then(function(r) {
            resolve(r.map(function(item) {
              return modelParser.clearUser(item);
            }));
          })
          .catch(reject);
      });
    },

    save: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getByEmail(entity.email)
          .then(function(user) {
            if (!user) {
              logger.debug('Saving the new user. Entity: ', JSON.stringify(entity));
              var o = modelParser.prepare(entity, true);
              o.password = md5(entity.password);
              logger.debug('Entity  after prepare: ', JSON.stringify(o));

              if (!self.userIsAdministrator(self.currentUser)) {
                o.role = 'user';
              }

              o.wallet = {
                coins: 0,
                averageValue: 0
              };

              return userDAO.save(o);
            } else {
              throw {
                status: 409,
                message: 'The email ' + entity.email + ' is already in use by other user'
              };
            }
          })
          .then(function(r) {
            resolve(modelParser.clearUser(r));
          })
          .catch(reject);
      });
    },

    update: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var o = modelParser.prepare(entity, false);
        self.getByEmail(entity.email)
          .then(function(user) {
            if (!user || (user && user.id === entity.id)) {
              if (!self.userIsAdministrator(self.currentUser) && self.currentUser.id !== entity.id) {
                throw {
                  status: 404,
                  message: 'User not found'
                };
              }

              if (o.password) {
                o.password = md5(o.password);
              }

              if (!self.userIsAdministrator(self.currentUser)) {
                o.role = 'user';
              }

              return userDAO.update(o);
            } else {
              throw {
                status: 409,
                message: 'The email ' + entity.email + ' is already in use by other user'
              };
            }
          })
          .then(function(r) {
            resolve(modelParser.clearUser(r));
          })
          .catch(reject);
      });
    },

    getById: function(id) {
      return new Promise(function(resolve, reject) {
        userDAO.getById(id)
          .then(function(user) {
            if (user) {
              return modelParser.clearUser(user);
            } else {
              return null;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getByLogin: function(email, password) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var filter = {
          email: email,
          password: md5(password)
        };

        self.getAll(filter)
          .then(function(users) {
            if (users.length) {
              return users[0];
            } else {
              return null;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getByEmail: function(email) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var filter = {
          email: email
        };

        self.getAll(filter)
          .then(function(users) {
            if (users.length) {
              logger.info('User found by email', JSON.stringify(users[0]));
              return users[0];
            } else {
              return null;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    generateToken: function(email, password, info) {
      var self = this;
      return new Promise(function(resolve, reject) {
        self.getByLogin(email, password)
          .then(function(user) {
            if (user) {
              return userDAO.addLoginToHistory(user.id, info.ip, info.userAgent);
            } else {
              return null;
            }
          })
          .then(function(user) {
            if (user) {
              user = modelParser.clearUser(user);
              user.token = jwtHelper.createToken(user);
              return user;
            } else {
              throw {
                status: 404,
                message: 'User not found'
              };
            }
          })
          .then(function(user) {
            resolve(modelParser.clearUser(user));
          })
          .catch(reject);
      });
    },

    delete: function(id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getById(id)
          .then(function(user) {
            if (!user) {
              throw {
                status: 404,
                message: 'User not found'
              };
            } else if (!self.userIsAdministrator(self.currentUser) && self.currentUser.id !== user.id.toString()) {
                throw {
                  status: 404,
                  message: 'User not found'
                };
            } else {
              return userDAO.disable(id);
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getLoginHistory: function(id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        userDAO.getById(id, true)
          .then(function(user) {
            if (user) {
              console.log(typeof self.currentUser.id , typeof user._id.toString());
              if (!self.userIsAdministrator(self.currentUser) && self.currentUser.id !== user._id.toString()) {
                logger.warn('An user is trying to see the history from another user');
                logger.debug('Current user', JSON.stringify(self.currentUser));
                logger.debug('Target user', JSON.stringify(user));
                throw {
                  status: 404,
                  message: 'User not found'
                };
              } else {
                return user.loginHistory;
              }
            } else {
              logger.warn('User not found');
              throw {
                status: 404,
                message: 'User not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    addTransaction: function(userId, transaction) {
      var self = this;

      return new Promise(function(resolve, reject) {
        userDAO.getById(userId, true)
          .then(function(user) {
            if (user) {
              if (!self.userIsAdministrator(self.currentUser) && self.currentUser.id !== user._id.toString()) {
                  throw {
                    status: 404,
                    message: 'User not found'
                  };
              } else {
                var newAvarageValue = undefined;
                if (transaction.transactionType === 1) {
                  if (user.wallet.averageValue === 0 && user.wallet.coins === 0) {
                    newAvarageValue = transaction.averageValue;
                  } else {
                    newAvarageValue = (user.wallet.averageValue + transaction.averageValue) / 2;
                  }
                }
                return userDAO.addTransaction(userId, transaction,newAvarageValue);
              }
            } else {
              throw {
                status: 404,
                message: 'User not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },
  };
};
