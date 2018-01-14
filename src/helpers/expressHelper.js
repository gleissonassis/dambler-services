var logger          = require('../config/logger');
var JWTHelper       = require('../helpers/jwtHelper');

module.exports = function() {
  var jwtHelper = new JWTHelper();
  return {
    parseCurrentUser: function(req, res, next) {
      logger.info('Checking if there is Bearer Authorization token');
      logger.debug(req.headers);
      if (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')) {
        logger.info('There is Bearer Authorization token', req.headers['Authorization']);
        var data = req.headers['authorization'].split(' ');

        var user = jwtHelper.decodeToken(data[1]);

        if (user) {
          logger.info('Current user is ', user);
          req.currentUser = user;
        } else {
          logger.warn('The Bearer Authorization is invalid');
        }
      } else {
        logger.info('There is no Bearer Authorization token');
      }
      next();
    },

    requireLogin: function(req, res, next) {
      if (req.currentUser) {
        logger.info('There is a current user logged in');
        next();
      } else {
        logger.info('There is no user logged in');
        res.status(403).json({});
      }
    },

    requireAdmin: function(req, res, next) {
      if (req.currentUser) {
        if (req.currentUser.role === 'admin') {
          next();
        } else {
          res.status(401).json({});
        }
      } else {
        res.status(403).json({});
      }
    },

    requireSameUser: function(req, res, next) {
      if (req.currentUser) {
        logger.debug('Current user', req.currentUser);
        logger.debug('Target user id', req.params.id);
        if (req.currentUser.role === 'admin' || req.currentUser.id === req.params.id) {
          logger.info('Current user is the target user');
          next();
        } else {
          logger.info('Current user is not the target user');
          res.status(404).json({});
        }
      } else {
        res.status(403).json({});
      }
    }
  };
};
