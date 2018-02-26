module.exports = function(app) {
  var controller = app.controllers.notification;

  app.route('/v1/notifications')
    .post(controller.sendNotification);
};
