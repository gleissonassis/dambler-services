module.exports = function(app) {
  var controller = app.controllers.cep;

  app.route('/v1/cep/:cep')
    .get(controller.getCEPInfo);
};
