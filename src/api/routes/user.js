var ExpressHelper         = require('../../helpers/expressHelper');

module.exports = function(app) {
  var expressHelper = new ExpressHelper();
  var controller = app.controllers.user;

  app.route('/v1/users')
    .get(expressHelper.requireLogin, controller.getAll)
    .post(controller.save);

  app.route('/v1/users/me')
    .put(expressHelper.requireLogin, controller.updateMe)
    .get(expressHelper.requireLogin, controller.getMe);

  app.route('/v1/users/auth')
    .post(controller.auth);

  app.route('/v1/users/auth/tokens')
    .post(expressHelper.requireLogin, controller.updateToken);

  app.route('/v1/users/:id')
    .get(controller.getById)
    .put(expressHelper.requireSameUser, controller.update)
    .delete(expressHelper.requireSameUser, controller.delete);

  app.route('/v1/users/:id/notifications')
    .post(controller.sendNotification);

  app.route('/v1/users/:id/login-history')
    .get(expressHelper.requireSameUser, controller.getLoginHistory);

  app.route('/v1/users/:id/confirm/:key')
    .post(controller.confirmUser);

  app.route('/v1/users/:id/reset-password/:key')
    .post(controller.resetPassword);
};
