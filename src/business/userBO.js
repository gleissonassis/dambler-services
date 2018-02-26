var Promise         = require('promise');
var md5             = require('../helpers/md5');
var logger          = require('../config/logger');
var settings        = require('../config/settings');

module.exports = function(dependencies) {
  var userDAO = dependencies.userDAO;
  var jwtHelper = dependencies.jwtHelper;
  var modelParser = dependencies.modelParser;
  var userHelper = dependencies.userHelper;
  var notificationBO = dependencies.notificationBO;

  return {
    currentUser: {},
    dependencies: dependencies,

    setCurrentUser: function(currentUser) {
      this.currentUser = currentUser;
    },

    clear: function() {
      return userDAO.clear();
    },

    getAll: function(filter, allFields) {
      return new Promise(function(resolve, reject) {
        filter.isEnabled = true;
        logger.info('Listing all users by filter ', filter);
        userDAO.getAll(filter, allFields)
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
        var confirmationKey = null;

        // generating a random number for confirmation key and internal key
        var randomConfirmationKey =  new Date().getTime() * Math.random();
        var randomInternalKey =  new Date().getTime() * Math.random();
        logger.debug('Generating random numbers to create confirmation key and internal key',
                     randomConfirmationKey,
                     randomInternalKey);

        self.getByEmail(entity.email)
          .then(function(user) {
            if (!user) {
              logger.debug('Saving the new user. Entity: ', JSON.stringify(entity));
              var o = modelParser.prepare(entity, true);
              if (o.password) {
                o.password = md5(entity.password);
              }

              confirmationKey = md5(randomConfirmationKey + entity.email + entity.name + entity.password);

              o.confirmation = {
                key: confirmationKey,
                isConfirmed: false
              };

              o.internalKey = md5(randomInternalKey + confirmationKey);

              if (!userHelper.isAdministrator(self.currentUser)) {
                o.role = 'user';
              }

              o.wallet = settings.dambler.initialWallet;

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
            return modelParser.clearUser(r);
          })
          .then(function(r) {
            //this notification will not be part of the chain
            notificationBO.sendNotification({
              userId: r.id,
              type: 'new-user'
            });
            return r;
          })
          .then(resolve)
          .catch(reject);
      });
    },

    update: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        logger.info('Updating a user ', JSON.stringify(entity));

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

              // generating a new internal key for security reasons
              o.internalKey = md5(o.internalKey + new Date());

              return userDAO.update(o);
            } else {
              logger.debug('User id: ', user.id);
              logger.debug('Entity id: ', entity.id);
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

          self.getAll(filter, true)
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

    getByEmail: function(email, allFields) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var filter = {
          email: email
        };

        self.getAll(filter, allFields)
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
        var user = null;

        self.getByLogin(email, password)
          .then(function(r) {
            user = r;
            if (user) {
              return userDAO.addLoginToHistory(user.id, info.ip, info.userAgent);
            } else {
              return null;
            }
          })
          .then(function() {
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
                  message: 'Please check if the provided user exists. User not found.'
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
                      code: 2,
                      message: 'The user do not have any coins to perform a bid'
                    };
                  } else {
                    //if the transaction is debit the averageValue is the same that the wallet
                    transaction.averageValue = user.wallet.averageValue;
                  }
                }

                transaction.date = new Date();

                //sending newAvarageValue as undefined the value will not be changed at the database
                return userDAO.addTransaction(userId, transaction, newAvarageValue);
              }
            } else {
              throw {
                status: 404,
                message: 'Can not register the transaction. User not found.'
              };
            }
          })
          .then(function(item) {
            resolve(modelParser.clearUser(item));
          })
          .catch(reject);
      });
    },

    confirmUser: function(userId, key, info) {
      return new Promise(function(resolve, reject) {
        userDAO.getByConfirmationKey(userId, key)
          .then(function(user) {
            if (user) {
              return userDAO.confirmUser(userId, key, info);
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

    resetPassword: function(userId, internalKey, newPassword) {
      return new Promise(function(resolve, reject) {
        userDAO.getByInternalKey(userId, internalKey)
          .then(function(user) {
            if (user) {
              return userDAO.resetPassword(userId, md5(Math.random() + internalKey), md5(newPassword));
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

    generateNewToken: function(user) {
      var self = this;

      return new Promise(function(resolve, reject) {
        logger.info('Updating a new token for the user ', JSON.stringify(user));

        self.getByEmail(user.email)
          .then(function(user) {
            logger.info('An user was found by email, so a new token will be generated');
            if (user) {
              user.token = jwtHelper.createToken(user);
              logger.info('New token ', JSON.stringify(user));
              return user;
            } else {
              throw {
                status: 404,
                message: 'Can not update the token. User not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
