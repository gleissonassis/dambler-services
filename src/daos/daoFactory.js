var UserDAO                 = require('./userDAO');
var AuctionDAO              = require('./auctionDAO');
var MailTemplateDAO         = require('./mailTemplateDAO');
var CoinPackageDAO          = require('./coinPackageDAO');
var PaymentTransactionDAO   = require('./paymentTransactionDAO');

module.exports = {
  getDAO: function(dao) {
    switch (dao) {
      case 'user':
        return new UserDAO();
      case 'paymentTransaction':
        return new PaymentTransactionDAO();
      case 'auction':
        return new AuctionDAO();
      case 'mailTemplate':
        return new MailTemplateDAO();
      case 'coinPackage':
        return new CoinPackageDAO();
      default:
        return null;
    }
  }
};
