var PayerServicesHelper   = require('../../../src/helpers/payerServicesHelper');
var RequestHelper         = require('../../../src/helpers/requestHelper');
var request               = require('request');
var md5                   = require('../../../src/helpers/md5');

describe('helpers', function(){
  describe('payerServicesHelper', function(){
    it('should store a new transaction at Payser Services', function() {
      this.timeout(5000);

      var payerServicesHelper = new PayerServicesHelper({
        requestHelper: new RequestHelper({
          request: request
        })
      });

      payerServicesHelper.payerSettings = {
        auth: {
          email: 'admin@payer.com.br',
          password: 'newPassword',
          endpoint: 'http://localhost:5001/v1/users/auth'
        },
        appKey: 'dambler',
        pagSeguro: {
          currency: 'BRL',
          shippingType: 2
        },
        endpoint: 'http://localhost:5001/v1/transactions'
      };

      var referenceCode = md5(new Date().getTime().toString());

      return payerServicesHelper.createTransaction({
        price: 9.99,
        description: 'Just a Description'
      },{
        id: referenceCode
      });
    });
  });
});
