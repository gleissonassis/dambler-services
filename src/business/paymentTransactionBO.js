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

    parseNotification: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        logger.info('Parsing a notification from payer system: ', JSON.stringify(entity));

        var chain = Promise.resolve();
        var paymentTransaction = null;
        var previousStatus = null;

        chain
          .then(function() {
            logger.info('Getting the payment transaction by the id', entity.transactionId);
            return self.getById(entity.transactionId);
          })
          .then(function(r) {
            paymentTransaction = r;
            previousStatus = paymentTransaction.status;
            return r;
          })
          .then(function() {
            if (!paymentTransaction.notifications) {
              paymentTransaction.notifications = [];
            }

            logger.info('Updating the payment transaction to store the new notification and the reference values');
            paymentTransaction.notifications.push({
              status: entity.newStatus,
              price: entity.realPrice,
              data: entity.data,
              date: new Date()
            });

            paymentTransaction.realPrice = entity.realPrice;
            paymentTransaction.status = self.parseStatusNotification(entity);

            logger.debug(JSON.stringify(paymentTransaction));

            return paymentTransaction;
          })
          .then(function(r) {
            var o = modelParser.prepare(r);
            return paymentTransactionDAO.update(o);
          })
          .then(function(r) {
            logger.info('Payment transaction updated successfully', JSON.stringify(r));

            if (paymentTransaction.status.code === 2) {
              var averageValue = paymentTransaction.realPrice / paymentTransaction.coins;
              logger.debug('The user wallet will be update to receive the new coins',
                paymentTransaction.coins,
                averageValue);

              return userBO.addTransaction(paymentTransaction.user.id, {
                transactionType: 1,
                coins: paymentTransaction.coins,
                averageValue: paymentTransaction.realPrice / paymentTransaction.coins,
                description: 'A payment was proccessed'
              });
            } else if (paymentTransaction.status.code === 3 && previousStatus.code === 2) {
              logger.debug('The user wallet will be update to remove the coins previously credited',
                paymentTransaction.coins);
              return userBO.addTransaction(paymentTransaction.user.id, {
                transactionType: 0,
                coins: paymentTransaction.coins,
                averageValue: paymentTransaction.realPrice / paymentTransaction.coins,
                description: 'A withdraw was performed in you wallet because a problem was identified'
              });
            }
          })
          .then(function() {
            return paymentTransaction;
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
    },

    parseStatusNotification: function(notification) {
      logger.info('Parsing an status notification. Notification: ', JSON.stringify(notification));
      var r = null;
      switch (notification.newStatus.toString()) {
        case '1':
        case '2':
          r = {
            code: 1,
            description: 'Waiting for payment'
          };
          break;
        case '3':
        case '4':
          r = {
            code: 2,
            description: 'Completed'
          };
          break;
        default:
          r = {
            code: 3,
            description: 'Problem'
          };
          break;
      }

      logger.info('Parsed status notification: ', JSON.stringify(r));

      return r;
    }
  };
};
