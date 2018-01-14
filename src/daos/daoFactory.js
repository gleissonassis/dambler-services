var UserDAO       = require('./userDAO');
var AuctionDAO    = require('./auctionDAO');

module.exports = {
  getDAO: function(dao) {
    switch (dao) {
      case 'user':
        return new UserDAO();
      case 'auction':
        return new AuctionDAO();
      default:
        return null;
    }
  }
};
