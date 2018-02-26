var chai                  = require('chai');
var expect                = chai.expect;
var PayerServicesHelper   = require('../../../src/helpers/payerServicesHelper');

describe('helpers', function(){
  describe('payerServicesHelper', function(){
    it('should create a PagSeguro payload', function() {
      var payerServicesHelper = new PayerServicesHelper();

      payerServicesHelper.payerSettings = {
        pagSeguro: {
          currency: 'BRL',
          shippingType: 2
        }
      };

      var r = payerServicesHelper.createPagSeguroPayload({
        price: 9.99,
        description: 'Just a Description'
      },{
        id: 'transaction-id'
      });

      expect(r.currency).to.be.equal('BRL');
      expect(r.shippingType).to.be.equal(2);
      expect(r.itemId1).to.be.equal(1);
      expect(r.itemDescription1).to.be.equal('Just a Description');
      expect(r.itemAmount1).to.be.equal(9.99);
      expect(r.itemQuantity1).to.be.equal(1);
      expect(r.itemWeight1).to.be.equal(0);
      expect(r.reference).to.be.equal('transaction-id');
    });

    it('should create a Payer payload', function() {
      var payerServicesHelper = new PayerServicesHelper({
        requestHelper: new RequestHelper(request)
      });

      payerServicesHelper.payerSettings = {
        appKey: 'appKey',
        pagSeguro: {
          currency: 'BRL',
          shippingType: 2
        }
      };

      var r = payerServicesHelper.createPayload({
        price: 9.99,
        description: 'Just a Description'
      },{
        id: 'transaction-id'
      });

      expect(r.data.currency).to.be.equal('BRL');
      expect(r.data.shippingType).to.be.equal(2);
      expect(r.data.itemId1).to.be.equal(1);
      expect(r.data.itemDescription1).to.be.equal('Just a Description');
      expect(r.data.itemAmount1).to.be.equal(9.99);
      expect(r.data.itemQuantity1).to.be.equal(1);
      expect(r.data.itemWeight1).to.be.equal(0);
      expect(r.data.reference).to.be.equal('transaction-id');
      expect(r.referenceCode).to.be.equal('transaction-id');
      expect(r.appKey).to.be.equal('appKey');
    });
  });
});
