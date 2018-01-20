var UserBO                = require('../../business/userBO');
var DAOFactory            = require('../../daos/daoFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');
var ModelParser           = require('../../models/modelParser');
var JWTHelper             = require('../../helpers/jwtHelper');
var UserHelper            = require('../../helpers/userHelper');

module.exports = function() {
  var modelParser = new ModelParser();

  var business = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    modelParser: modelParser,
    jwtHelper: new JWTHelper(),
    userHelper: new UserHelper()
  });

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
    }
  };
};
