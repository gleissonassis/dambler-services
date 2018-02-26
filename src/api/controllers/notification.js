var UserBO                = require('../../business/userBO');
var NotificationBO        = require('../../business/notificationBO');
var MailTemplateBO        = require('../../business/mailTemplateBO');
var DAOFactory            = require('../../daos/daoFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');
var ModelParser           = require('../../models/modelParser');
var JWTHelper             = require('../../helpers/jwtHelper');
var UserHelper            = require('../../helpers/userHelper');
var DynamicTextHelper     = require('../../helpers/dynamicTextHelper');
var StringReplacerHelper  = require('../../helpers/stringReplacerHelper');
var SendMailHelper        = require('../../helpers/sendMailHelper');
var nodemailer            = require('nodemailer');

module.exports = function() {
  var modelParser = new ModelParser();

  var business = new NotificationBO({
    mailTemplateBO: new MailTemplateBO({
      mailTemplateDAO: DAOFactory.getDAO('mailTemplate'),
      modelParser: modelParser,
    }),
    userBO: new UserBO({
      userDAO: DAOFactory.getDAO('user'),
      jwtHelper: new JWTHelper(),
      modelParser: modelParser,
      userHelper: new UserHelper()
    }),
    dynamicTextHelper: new DynamicTextHelper({
      stringReplacerHelper: new StringReplacerHelper()
    }),
    sendMailHelper: new SendMailHelper(nodemailer),
  });

  return {
    sendNotification: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.sendNotification(req.body)
        .then(rh.ok)
        .catch(rh.error);
    }
  };
};
