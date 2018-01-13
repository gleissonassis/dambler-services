var UserDAO       = require('./userDAO');

module.exports = {
  getDAO: function(dao) {
    switch (dao) {
      case 'user':
        return new UserDAO();
      default:
        return null;
    }
  }
};
