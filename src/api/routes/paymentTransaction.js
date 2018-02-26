var ExpressHelper         = require('../../helpers/expressHelper');

module.exports = function(app) {
  var expressHelper = new ExpressHelper();
  var controller = app.controllers.paymentTransaction;

  app.route('/v1/payments-transactions')
    .post(expressHelper.requireLogin, controller.save);

  app.route('/v1/payments-transactions/:id')
    .get(expressHelper.requireLogin, controller.getById);
};
