var ExpressHelper         = require('../../helpers/expressHelper');

module.exports = function(app) {
  var expressHelper = new ExpressHelper();
  var controller = app.controllers.coinPackage;

  app.route('/v1/coin-packages')
    .get(controller.getAll)
    .post(expressHelper.requireAdmin, controller.save);

  app.route('/v1/coin-packages/:id')
    .get(controller.getById)
    .put(expressHelper.requireAdmin, controller.update)
    .delete(expressHelper.requireAdmin, controller.delete);
};
