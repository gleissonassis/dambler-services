var logger              = require('winston');
var model               = require('../models/coinPackage')();
var Promise             = require('promise');
var $                   = require('mongo-dot-notation');

module.exports = function() {
  return {
    clear: function() {
      return new Promise(function(resolve, reject) {
        model.remove({}, function(err) {
          if (err) {
            logger.log('error', 'An error has occurred while deleting all coin packages', error);
            reject(err);
          } else {
            logger.log('info', 'The coin packages have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        logger.info('Getting coin packages from database', filter);

        model.find(filter)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('%d coin packages were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.log('error', 'An error has ocurred while getting coin packages from database', erro);
            reject(erro);
          });
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Creating a new coin package', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.log('info', 'The coin package has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('An error has ocurred while saving a new coin package', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },

    update: function(entity) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Update a coin package');

        model.findByIdAndUpdate(entity._id, $.flatten(entity), {'new': true})
        .then(function(item) {
          logger.log('info', 'The coin package has been updated succesfully');
          logger.debug(JSON.stringify(item.toObject()));
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while updating a coin package', error);
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
        logger.log('info', 'Getting a coin package by id %s', id);

        self.getAll({_id: id, isEnabled: true})
        .then(function(entities) {
          if (entities.length === 0) {
            logger.info('Coin package not found');
            resolve(null);
          } else {
            logger.info('The coin package was found');
            logger.debug(JSON.stringify(entities[0]));
            resolve(entities[0]);
          }
        }).catch(function(erro) {
            logger.log('error', 'An error has occurred while getting a coin package by id %s', id, erro);
            reject(erro);
        });
      });
    },

    disable: function(id) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Disabling a coin package');

        model.findByIdAndUpdate(id, {_id:id, isEnabled: false}, {'new': true})
        .then(function(item) {
          logger.log('info', 'The coin package has been disabled succesfully');
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while disabling a coin package', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },
  };
};
