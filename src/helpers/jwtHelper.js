var jwt           = require('jsonwebtoken');
var settings      = require('../config/settings');

module.exports = function() {
  return {
    secret: settings.jwt.secret,
    expiresIn: settings.jwt.expiresIn,
    createToken: function(user) {
      return jwt.sign(user, settings.jwt.secret, {expiresIn: settings.jwt.expiresIn});
    },

    decodeToken: function(token) {
      try {
        return jwt.verify(token, settings.jwt.secret);
      } catch (err) {
        console.log(err);
        return null;
      }
    }
  };
};
