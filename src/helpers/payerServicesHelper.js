var Promise       = require('promise');
var logger        = require('../config/logger');
var settings      = require('../config/settings');

module.exports = function(dependencies) {
  var requestHelper = dependencies.requestHelper;

  return {
    payerSettings: settings.payer,

    createPayload: function(coinPackage, paymentTransaction) {
      logger.info('[PayerServicesHelper] Creating the payload to be sent to Payser Services');
      var r = {
        referenceCode: paymentTransaction.id,
        appKey: this.payerSettings.appKey,
        data: this.createPagSeguroPayload(coinPackage, paymentTransaction)
      };
      logger.debug('[PayerServicesHelper] Payload', JSON.stringify(r));

      return r;
    },

    createPagSeguroPayload: function(coinPackage, paymentTransaction) {
      logger.info('[PayerServicesHelper] Creating PagSeguro payload to be sent to Payser Services ');
      var r = {
        currency: this.payerSettings.pagSeguro.currency,
        itemId1: 1,
        itemDescription1: coinPackage.description,
        itemAmount1: parseFloat(coinPackage.price).toFixed(2), // it is necessary due to PagSeguro rules
        itemQuantity1: 1,
        itemWeight1: 0,
        shippingType: this.payerSettings.pagSeguro.shippingType,
        reference: paymentTransaction.id
      };
      logger.debug('[PayerServicesHelper] PagSeguro payload', JSON.stringify(r));
      return r;
    },

    doAuth: function() {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.info('[PayerServicesHelper] Performing app authentication at ',
                        self.payerSettings.auth.endpoint, self.payerSettings.auth.email);

            var authData = {
              email: self.payerSettings.auth.email,
              password: self.payerSettings.auth.password
            };

            return requestHelper.post(self.payerSettings.auth.endpoint,
              authData,
              {},
              true);
          })
          .then(function(r) {
            logger.info('[PayerServicesHelper] App response ', r);
            logger.info('[PayerServicesHelper] Returning the token ', r.token);

            return r.token;
          })
          .then(resolve)
          .catch(reject);
      });
    },

    postTransaction: function(payload, token) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {

            logger.info('[PayerServicesHelper] Sending the transaction the Payer', self.payerSettings.endpoint);
            return requestHelper.post(self.payerSettings.endpoint,
              payload,
              token ? {'Authorization':'Bearer ' + token} : {},
              true,
              [201]);
          })
          .then(function(r) {
            logger.info('[PayerServicesHelper] App response ', JSON.stringify(r));
            return r;
          })
          .then(resolve)
          .catch(reject);
      });
    },


    createTransaction: function(coinPackage, paymentTransaction) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            return self.doAuth();
          })
          .then(function(token) {
            var payload = self.createPayload(coinPackage, paymentTransaction);
            return self.postTransaction(payload, token);
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
