var UserBO                = require('../../business/userBO');
var DAOFactory            = require('../../daos/daoFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');
var ModelParser           = require('../../models/modelParser');
var JWTHelper             = require('../../helpers/jwtHelper');

module.exports = function() {
  var modelParser = new ModelParser();

  var business = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    modelParser: modelParser,
    jwtHelper: new JWTHelper()
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
      business.generateToken(req.body.email, req.body.password)
        .then(rh.ok)
        .catch(rh.error);
    }
  };
};
