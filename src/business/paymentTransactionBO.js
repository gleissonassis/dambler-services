var Promise         = require('promise');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var paymentTransactionDAO = dependencies.paymentTransactionDAO;
  var coinPackageBO = dependencies.coinPackageBO;
  var userBO = dependencies.userBO;
  var modelParser = dependencies.modelParser;
  var payerServicesHelper = dependencies.payerServicesHelper;

  return {
    dependencies: dependencies,

    clear: function() {
      return paymentTransactionDAO.clear();
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        filter.isEnabled = true;
        logger.info('Listing all payments transactions by filter ', filter);
        paymentTransactionDAO.getAll(filter)
          .then(function(r) {
            resolve(r.map(function(item) {
              return modelParser.clear(item);
            }));
          })
          .catch(reject);
      });
    },

    save: function(entity) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();
        var coinPackage = null;
        var paymentTransaction = null;

        chain
          .then(function() {
            return coinPackageBO.getById(entity.coinPackageId);
          })
          .then(function(r) {
            coinPackage = r;
            return userBO.getById(entity.userId);
          })
          .then(function(user) {
            logger.debug('Saving the payment transaction. Entity: ', JSON.stringify(entity));
            entity.status = {
              code: 0,
              description: 'Saving'
            };
            entity.coins = coinPackage.coins;
            entity.price = coinPackage.price;
            entity.date = new Date();
            entity.user = {
              id: user.id,
              name: user.name
            };
            var o = modelParser.prepare(entity, true);
            logger.debug('Entity  after prepare: ', JSON.stringify(o));
            return paymentTransactionDAO.save(o);
          })
          .then(function(r) {
            logger.debug('Clearing the object by removing unnecessary informations', JSON.stringify(r));
            return modelParser.clear(r);
          })
          .then(function(r) {
            paymentTransaction = r;
            logger.debug('Creating the transaction on Payer Services', JSON.stringify(r));
            return payerServicesHelper.createTransaction(coinPackage, paymentTransaction);
          })
          .then(function(r) {
            logger.debug('Updating the current payment transaction with Payer informations', JSON.stringify(r));
            // the first response of Payer is the checkout response
            paymentTransaction.payerTracking = {
              id: r.id,
              checkout: r.responses[0].data.checkout
            };

            paymentTransaction.status = {
              code: 1,
              description: 'Waiting for payment'
            };

            return paymentTransactionDAO.update(modelParser.prepare(paymentTransaction));
          })
          .then(function(r) {
            logger.debug('Returning to the user all payment informations', JSON.stringify(r));
            return modelParser.clear(r);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    update: function(entity) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();
        var o = modelParser.prepare(entity, false);

        chain
          .then(function() {
            return paymentTransactionDAO.update(o);
          })
          .then(function(r) {
            return modelParser.clear(r);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getById: function(id) {
      return new Promise(function(resolve, reject) {
        paymentTransactionDAO.getById(id)
          .then(function(paymentTransaction) {
            if (paymentTransaction) {
              return modelParser.clear(paymentTransaction);
            } else {
              throw {
                status: 404,
                message: 'Payment transaction not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
