var logger              = require('winston');
var model               = require('../models/user')();
var Promise             = require('promise');
var $                   = require('mongo-dot-notation');

module.exports = function() {
  var projectionAllFields = {
    password: false,
    __v: false,
    isEnabled: false,
    loginHistory: false,
    'wallet.transactions': false
  };

  projectionCommonWithWallet = {
    password: false,
    __v: false,
    isEnabled: false,
    loginHistory: false,
    isEnabled: false,
    confirmation: false,
    internalKey: false,
    'wallet.transactions': false,
    'wallet.averageValue': false
  };

  var projectionCommonFields = {
    password: false,
    __v: false,
    isEnabled: false,
    wallet: false,
    loginHistory: false,
    isEnabled: false,
    confirmation: false,
    internalKey: false
  };

  return {
    clear: function() {
      return new Promise(function(resolve, reject) {
        model.remove({}, function(err) {
          if (err) {
            logger.log('error', 'An error has occurred while deleting all users', error);
            reject(err);
          } else {
            logger.log('info', 'The users have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getAll: function(filter, allFields) {
      return new Promise(function(resolve, reject) {
        logger.info('Getting users from database', filter);

        var projection = {};

        if (!allFields) {
          projection = Object.assign({}, projectionCommonFields);
        } else {
          projection = Object.assign({}, projectionAllFields);
        }

        model.find(filter, projection)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('%d users were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.log('error', 'An error has ocurred while getting users from database', erro);
            reject(erro);
          });
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Creating an new user', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.log('info', 'The user has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('An error has ocurred while saving a new user', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },


    update: function(entity) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Update a user');

        model.findByIdAndUpdate(entity._id, $.flatten(entity), {'new': true, fields: projectionCommonWithWallet})
        .then(function(item) {
          logger.log('info', 'The user has been updated succesfully');
          logger.debug(JSON.stringify(item.toObject()));
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while updateing an user', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    getById: function(id, allFields) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Getting a user by id %s', id);

        self.getAll({_id: id, isEnabled: true}, allFields)
        .then(function(users) {
          if (users.length === 0) {
            resolve(null);
            logger.log('info', 'User not found');
          } else {
            resolve(users[0]);
            logger.log('info', 'The user was found');
          }
        }).catch(function(erro) {
            logger.log('error', 'An error has occurred while geeting an user by id %s', id, erro);
            reject(erro);
        });
      });
    },

    getByConfirmationKey: function(id, confirmationKey) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Getting a user by confirmation key %s', id);

        self.getAll({_id: id, 'confirmation.key': confirmationKey, 'confirmation.isConfirmed': false, isEnabled: true})
        .then(function(users) {
          if (users.length === 0) {
            logger.log('info', 'User not found');
            return null;
          } else {
            logger.log('info', 'The user was found');
            return users[0];
          }
        })
        .then(resolve)
        .catch(function(erro) {
            logger.log('error', 'An error has occurred while geeting an user confirmation key %s', id, erro);
            reject(erro);
        });
      });
    },

    getByInternalKey: function(id, internalKey) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Getting a user by internal key %s', id);

        self.getAll({_id: id, internalKey: internalKey, isEnabled: true})
        .then(function(users) {
          if (users.length === 0) {
            logger.log('info', 'User not found');
            return null;
          } else {
            logger.log('info', 'The user was found');
            return users[0];
          }
        })
        .then(resolve)
        .catch(function(erro) {
            logger.log('error', 'An error has occurred while geeting an user by internal key %s', id, erro);
            reject(erro);
        });
      });
    },

    confirmUser: function(id, confirmationKey, info) {
      return this.update({
        _id: id,
        confirmation: {
          info: info,
          date: new Date(),
          key: confirmationKey,
          isConfirmed: true
        }
      });
    },

    resetPassword: function(id, newInternalKey, newPassword) {
      return this.update({
        _id: id,
        password: newPassword,
        internalKey: newInternalKey
      });
    },

    disable: function(id) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Disabling an user');

        model.findByIdAndUpdate(id, {_id:id, isEnabled: false}, {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.log('info', 'The user has been disabled succesfully');
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while disabling an user', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    addLoginToHistory: function(userId, ip, userAgent) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Adding to login history of the user the attempt');

        var history = {
          date: Date.now(),
          ip: ip,
          userAgent: userAgent
        };

        logger.debug(history);

        model.findByIdAndUpdate(userId, {$push: {loginHistory: history}}, {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.log('info', 'The history has been updated succesfully');
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while updating this user login history', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    addTransaction: function(userId, transaction, newAverageValue) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Adding to wallet the transaction', JSON.stringify(transaction));
        logger.debug('New average value', newAverageValue);

        var options = {
          $push: {
            'wallet.transactions': transaction
          },
          $inc: {
            'wallet.coins': transaction.transactionType === 1 ? transaction.coins : -transaction.coins
          },
          $set: {
            'wallet.averageValue': newAverageValue
          }
        };

        logger.debug('Options:', JSON.stringify(options));

        model.findByIdAndUpdate(userId, options, {'new': true, fields: projectionCommonWithWallet})
          .then(function(item) {
            logger.log('info', 'The transaction has been added to the user wallet');
            resolve(item.toObject());
          }).catch(function(error) {
            logger.error('An error has ocurred while adding the transaction', error);
            reject({
              status: 422,
              message: error
            });
          });
      });
    },
  };
};
