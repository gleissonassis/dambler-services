var logger      = require('../config/logger');

module.exports = function() {
  return {
    isAdministrator: function(user) {
      logger.info('Checking if the user is an administrator', JSON.stringify(user));
      var r  = user && user.role === 'admin';
      logger.debug('Is administrator?', r);
      return r;
    },

    isSameUser: function(currentUserId, userId) {
      try {
        logger.info('Checking if the current user is the supplied user', currentUserId, userId);
        var r = currentUserId.toString() === userId.toString();
        logger.debug('Are the same user?', r);
        return r;
      } catch (e) {
        logger.error('An error has occurred while checking if the current user is the supplied user', e);
        return false;
      }
    },

    isSameUserOrAdministrator: function(currentUser, userId) {
      return this.isAdministrator(currentUser) || this.isSameUser(currentUser.id, userId);
    }
  };
};
