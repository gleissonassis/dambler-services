var logger              = require('winston');
var model               = require('../models/paymentTransaction')();
var Promise             = require('promise');
var $                   = require('mongo-dot-notation');

module.exports = function() {
  return {
    clear: function() {
      return new Promise(function(resolve, reject) {
        model.remove({}, function(err) {
          if (err) {
            logger.log('error', 'An error has occurred while deleting all payments transacations', error);
            reject(err);
          } else {
            logger.log('info', 'The payments transactions have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        logger.info('Getting payments transactions from database', filter);

        model.find(filter)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('%d payments transactions were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.log('error', 'An error has ocurred while getting payments transactions from database', erro);
            reject(erro);
          });
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Creating a new payment transaction', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.log('info', 'The payment transaction has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('An error has ocurred while saving a new payment transaction', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },

    update: function(entity) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Update a payment transaction');

        model.findByIdAndUpdate(entity._id, $.flatten(entity), {'new': true})
        .then(function(item) {
          logger.log('info', 'The payment transaction has been updated succesfully');
          logger.debug(JSON.stringify(item.toObject()));
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while updating a payment transaction', error);
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
        logger.log('info', 'Getting a payment transaction by id %s', id);

        self.getAll({_id: id, isEnabled: true})
        .then(function(entities) {
          if (entities.length === 0) {
            logger.info('payment transaction not found');
            resolve(null);
          } else {
            logger.info('The payment transaction was found');
            logger.debug(JSON.stringify(entities[0]));
            resolve(entities[0]);
          }
        }).catch(function(erro) {
            logger.log('error', 'An error has occurred while getting a payment transaction by id %s', id, erro);
            reject(erro);
        });
      });
    }
  };
};
