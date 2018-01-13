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

    generateToken: function(email, password) {
      var self = this;
      return new Promise(function(resolve, reject) {
        self.getByLogin(email, password)
          .then(function(user) {
            if (user) {
              user.token = jwtHelper.createToken(user);
              return user;
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
            } else if (!self.userIsAdministrator(self.currentUser) && self.currentUser.id !== user.id) {
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
  };
};
