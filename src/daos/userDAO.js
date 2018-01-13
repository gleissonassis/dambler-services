var logger              = require('winston');
var model               = require('../models/user')();
var Promise             = require('promise');

module.exports = function() {
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

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        logger.info('Getting users from database', filter);

        model.find(filter)
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
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Creating a new user', entity);

        model.create(entity)
        .then(function(item) {
          logger.log('info', 'The user has been created succesfully', JSON.stringify(item));
          resolve(item.toObject());
        }).catch(function(error) {
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

        model.findByIdAndUpdate(entity._id, entity, {'new': true})
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

    getById: function(id) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Getting a user by id %s', id);

        self.getAll({_id: id, isEnabled: true})
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

    disable: function(id) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Disabling a user');

        model.findByIdAndUpdate(id, {_id:id, isEnabled: false}, {'new': true})
        .then(function(item) {
          logger.log('info', 'The user has been disabled succesfully');
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
  };
};
