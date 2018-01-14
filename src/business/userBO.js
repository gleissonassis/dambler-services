var Promise         = require('promise');
var md5             = require('../helpers/md5');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var userDAO = dependencies.userDAO;
  var jwtHelper = dependencies.jwtHelper;
  var modelParser = dependencies.modelParser;
  var userHelper = dependencies.userHelper;

  return {
    currentUser: {},

    setCurrentUser: function(currentUser) {
      this.currentUser = currentUser;
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

    createUserWithoutValidations: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getByEmail(entity.email)
          .then(function(user) {
            if (!user) {
              logger.debug('Saving the new user. Entity: ', JSON.stringify(entity));
              var o = modelParser.prepare(entity, true);
              o.password = md5(entity.password);
              logger.debug('Entity  after prepare: ', JSON.stringify(o));
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

    save: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getByEmail(entity.email)
          .then(function(user) {
            if (!user) {
              logger.debug('Saving the new user. Entity: ', JSON.stringify(entity));
              var o = modelParser.prepare(entity, true);
              if (o.password) {
                o.password = md5(entity.password);
              }
              logger.debug('Entity  after prepare: ', JSON.stringify(o));

              if (!userHelper.isAdministrator(self.currentUser)) {
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
              if (!userHelper.isAdministrator(self.currentUser) && self.currentUser.id !== entity.id) {
                throw {
                  status: 404,
                  message: 'User not found'
                };
              }

              if (o.password) {
                o.password = md5(o.password);
              }

              if (!userHelper.isAdministrator(self.currentUser)) {
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

    getById: function(id, allFields) {
      return new Promise(function(resolve, reject) {
        userDAO.getById(id, allFields)
          .then(function(user) {
            if (user) {
              return modelParser.clearUser(user);
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

    getByLogin: function(email, password) {
      var self = this;

      return new Promise(function(resolve, reject) {
        if (!email || !password) {
          reject({
            status: 422,
            message: 'Email and password are required fields'
          });
        } else {
          var filter = {
            email: email,
            password: md5(password)
          };

          self.getAll(filter)
            .then(function(users) {
              if (users.length) {
                return users[0];
              } else {
                throw {
                  status: 404,
                  message: 'User not found by the supplied credentials'
                };
              }
            })
            .then(resolve)
            .catch(reject);
        }
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
            } else if (!userHelper.isAdministrator(self.currentUser) && self.currentUser.id !== user.id.toString()) {
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
              if (!userHelper.isAdministrator(self.currentUser) && self.currentUser.id !== user._id.toString()) {
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
              if (!userHelper.isAdministrator(self.currentUser) && self.currentUser.id !== user._id.toString()) {
                throw {
                  status: 404,
                  message: 'User not found'
                };
              } else if (!userHelper.isAdministrator(self.currentUser) && transaction.transactionType === 1) {
                //only administrators can add founds to user's wallet
                throw {
                  status: 401
                };
              } else {
                var newAvarageValue = undefined;

                //if the transaction is credit it is necessary to calculate the
                //new averageValue value for the user's wallet, however if the
                //transaction is the first in the wallet the averageValue value will
                //be itself
                if (transaction.transactionType === 1) {
                  if (user.wallet.averageValue === 0 && user.wallet.coins === 0) {
                    newAvarageValue = transaction.averageValue;
                  } else {
                    newAvarageValue = (user.wallet.averageValue + transaction.averageValue) / 2;
                  }
                } else if (transaction.transactionType === 0) {
                  if (user.wallet.coins === 0) {
                    throw {
                      status: 409,
                      message: 'The user do not have any coins to perform a bid'
                    };
                  } else {
                    //if the transaction is debit the averageValue is the same that the wallet
                    transaction.averageValue = user.wallet.averageValue;
                  }
                }

                //sending newAvarageValue as undefined the value will not be changed at the database
                return userDAO.addTransaction(userId, transaction, newAvarageValue);
              }
            } else {
              throw {
                status: 404,
                message: 'User not found'
              };
            }
          })
          .then(function(item) {
            resolve(modelParser.clearUser(item));
          })
          .catch(reject);
      });
    }
  };
};
