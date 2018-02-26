var AuctionBO             = require('../../business/auctionBO');
var UserBO                = require('../../business/UserBO');
var DAOFactory            = require('../../daos/daoFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');
var ModelParser           = require('../../models/modelParser');
var UserHelper            = require('../../helpers/userHelper');

module.exports = function() {
  var modelParser = new ModelParser();
  var userHelper = new UserHelper();

  var userBO = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    modelParser: modelParser,
    userHelper: userHelper
  });

  var business = new AuctionBO({
    auctionDAO: DAOFactory.getDAO('auction'),
    userBO: userBO,
    modelParser: modelParser,
    userHelper: userHelper,
  });

  return {
    getAll: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.getAll(req.params.category)
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
      business.setCurrentUser(req.currentUser);
      req.body.id = req.params.id;
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

    getOnlineAuctions: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.getOnlineAuctions(req.params.category)
        .then(rh.ok)
        .catch(rh.error);
    },

    getOpenAuctions: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.getOpenAuctions(req.params.category)
        .then(rh.ok)
        .catch(rh.error);
    },

    addBid: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.setCurrentUser(req.currentUser);
      business.addBid(req.params.id, req.currentUser.id, {
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      })
        .then(function() {
          rh.created();
        })
        .catch(rh.error);
    }
  };
};
