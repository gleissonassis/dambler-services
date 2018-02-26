var UserBO                = require('../../business/userBO');
var MailTemplateBO        = require('../../business/mailTemplateBO');
var NotificationBO        = require('../../business/notificationBO');
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

  var business = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    jwtHelper: new JWTHelper(),
    modelParser: modelParser,
    userHelper: new UserHelper(),
    notificationBO: new NotificationBO({})
  });

  business.dependencies.notificationBO.setDependencies({
    mailTemplateBO: new MailTemplateBO({
      mailTemplateDAO: DAOFactory.getDAO('mailTemplate'),
      modelParser: modelParser,
    }),
    dynamicTextHelper: new DynamicTextHelper({
      stringReplacerHelper: new StringReplacerHelper()
    }),
    userBO: business,
    sendMailHelper: new SendMailHelper(nodemailer),
  });

  var notificationBO = business.dependencies.notificationBO;

  return {
    getAll: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.getAll({})
        .then(rh.ok)
        .catch(rh.error);
    },

    save: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.save(req.body)
        .then(function() {
          return business.generateToken(req.body.email, req.body.password, {
            ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          });
        })
        .then(function(r) {
          rh.created(modelParser.clearUser(r));
        })
        .catch(rh.error);
    },

    update: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      req.body.id = req.params.id;
      business.setCurrentUser(req.currentUser);
      business.update(req.body)
        .then(rh.ok)
        .catch(rh.error);
    },

    getById: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.getById(req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    },

    updateMe: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      req.body.id = req.currentUser.id;
      business.update(req.body)
        .then(rh.ok)
        .catch(rh.error);
    },

    getMe: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.getById(req.currentUser.id, true)
        .then(rh.ok)
        .catch(rh.error);
    },

    delete: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.delete(req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    },

    auth: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.generateToken(req.body.email, req.body.password, {
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      })
        .then(rh.ok)
        .catch(rh.error);
    },

    getLoginHistory: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.getLoginHistory(req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    },

    addTransaction: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.addTransaction(req.params.id, req.body)
        .then(rh.ok)
        .catch(rh.error);
    },

    confirmUser: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.confirmUser(req.params.id,
                          req.params.key,
                          {
                           ip: req.headers['x-forwarded-for'] ||
                               req.headers['x-real-ip'] ||
                               req.connection.remoteAddress,
                           userAgent: req.headers['user-agent']
                         })
        .then(rh.ok)
        .catch(rh.error);
    },

    sendNotification: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      var data = req.body;
      data.userId = req.params.id;
      notificationBO.sendNotification(data)
        .then(rh.ok)
        .catch(rh.error);
    },

    resetPassword: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.resetPassword(req.params.id, req.params.key, req.body.newPassword)
        .then(rh.ok)
        .catch(rh.error);
    },

    updateToken: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.generateNewToken(req.currentUser)
        .then(rh.ok)
        .catch(rh.error);
    }
  };
};
