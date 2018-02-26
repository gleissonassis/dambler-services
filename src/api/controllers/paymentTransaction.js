var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');
var UserBO                = require('../../../src/business/userBO');
var PaymentTransactionBO  = require('../../../src/business/paymentTransactionBO');
var CoinPackageBO         = require('../../../src/business/coinPackageBO');
var DAOFactory            = require('../../../src/daos/daoFactory');
var ModelParser           = require('../../../src/models/modelParser');
var JWTHelper             = require('../../../src/helpers/jwtHelper');
var PayerServicesHelper   = require('../../../src/helpers/payerServicesHelper');
var RequestHelper         = require('../../../src/helpers/requestHelper');

module.exports = function() {
  var userBO = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    modelParser: new ModelParser(),
    jwtHelper: new JWTHelper()
  });

  var coinPackageBO = new CoinPackageBO({
    coinPackageDAO: DAOFactory.getDAO('coinPackage'),
    modelParser: new ModelParser()
  });

  business = new PaymentTransactionBO({
    paymentTransactionDAO: DAOFactory.getDAO('paymentTransaction'),
    modelParser: new ModelParser(),
    coinPackageBO: coinPackageBO,
    payerServicesHelper: new PayerServicesHelper({
      requestHelper: new RequestHelper({
        request: require('request')
      })
    }),
    userBO: userBO
  });

  return {
    save: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      req.body.userId = req.currentUser.id;
      business.save(req.body)
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    getById: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getById(req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    }
  };
};
