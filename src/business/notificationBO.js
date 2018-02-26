var Promise         = require('promise');
var settings        = require('../config/settings');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var userBO = dependencies.userBO;
  var mailTemplateBO = dependencies.mailTemplateBO;
  var sendMailHelper = dependencies.sendMailHelper;
  var dynamicTextHelper = dependencies.dynamicTextHelper;

  return {
    dependencies: dependencies,

    setDependencies: function(dependencies) {
      userBO = dependencies.userBO;
      mailTemplateBO = dependencies.mailTemplateBO;
      sendMailHelper = dependencies.sendMailHelper;
      dynamicTextHelper = dependencies.dynamicTextHelper;

    },

    sendNotification: function(notification) {
      var self = this;

      return new Promise(function(resolve, reject) {
        logger.info('Sending the notificaton ', notification);

        var promise = null;

        // setting up if the user will be get by id or email
        if (notification.userId) {
          logger.info('The user will be get by id ', notification.userId);
          promise = userBO.getById(notification.userId, true);
        } else {
          logger.info('The user will be get by email ', notification.email);
          promise = userBO.getByEmail(notification.email, true);
        }

        promise
          .then(function(user) {
            var data = {
              user: user,
              request: notification,
              settings: settings
            };

            return self.sendMail(notification.type, user.email, data);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    sendMail: function(key, to, data) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            return mailTemplateBO.getByKey(key);
          })
          .then(function(mailTemplate) {
            if (mailTemplate) {
              logger.debug('Parsing the template',
                            mailTemplate.htmlTemplate,
                            mailTemplate.textTemplate,
                            mailTemplate.subject);

              dynamicTextHelper.entities = data;
              mailTemplate.htmlTemplate = dynamicTextHelper.parse(mailTemplate.htmlTemplate);
              mailTemplate.textTemplate = dynamicTextHelper.parse(mailTemplate.textTemplate);
              mailTemplate.subject = dynamicTextHelper.parse(mailTemplate.subject);

              logger.debug('After parsing the template',
                            mailTemplate.htmlTemplate,
                            mailTemplate.textTemplate,
                            mailTemplate.subject);

              return mailTemplate;
            } else {
              throw {
                status: 404,
                message: 'Mail template not found'
              };
            }
          })
          .then(function(template) {
            var mailOptions = {
              from: template.from,
              to: to,
              subject: template.subject,
              text: template.textTemplate,
              html: template.htmlTemplate
            };

            logger.info('Sending a email', mailOptions);

            return sendMailHelper.send(mailOptions);
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
