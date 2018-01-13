var ExpressHelper         = require('../../helpers/expressHelper');

module.exports = function(app) {
  var expressHelper = new ExpressHelper();
  var controller = app.controllers.user;

  app.route('/v1/users')
    .get(expressHelper.requireLogin, controller.getAll)
    .post(controller.save);

  app.route('/v1/users/auth')
    .post(controller.auth);

  app.route('/v1/users/:id')
    .get(controller.getById)
    .put(expressHelper.requireSameUser, controller.update)
    .delete(expressHelper.requireSameUser, controller.delete);
};
