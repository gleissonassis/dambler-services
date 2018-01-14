var ExpressHelper         = require('../../helpers/expressHelper');

module.exports = function(app) {
  var expressHelper = new ExpressHelper();
  var controller = app.controllers.auction;

  app.route('/v1/auctions')
    .get(controller.getAll)
    .post(expressHelper.requireAdmin, controller.save);

  app.route('/v1/auctions/online')
    .get(controller.getOnlineAuctions);

  app.route('/v1/auctions/:id')
    .get(expressHelper.requireLogin, controller.getById)
    .put(expressHelper.requireAdmin, controller.update)
    .delete(expressHelper.requireAdmin, controller.delete);

  app.route('/v1/auctions/:id/bids')
    .post(expressHelper.requireLogin, controller.addBid);
};
