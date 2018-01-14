var Promise         = require('promise');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var auctionDAO = dependencies.auctionDAO;
  var modelParser = dependencies.modelParser;
  var userHelper = dependencies.userHelper;
  var userBO = dependencies.userBO;

  return {
    currentUser: {},

    setCurrentUser: function(currentUser) {
      this.currentUser = currentUser;
      userBO.setCurrentUser(currentUser);
    },

    clear: function() {
      return auctionDAO.clear();
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        filter.isEnabled = true;
        auctionDAO.getAll(filter)
          .then(function(r) {
            resolve(r.map(function(item) {
              return modelParser.clear(item);
            }));
          })
          .catch(reject);
      });
    },

    getOnlineAuctions: function() {
      return new Promise(function(resolve, reject) {
        auctionDAO.getOnlineAuctions()
          .then(function(r) {
            resolve(r.map(function(item) {
              return modelParser.clear(item);
            }));
          })
          .catch(reject);
      });
    },

    save: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        if (userHelper.isAdministrator(self.currentUser)) {
          logger.debug('Saving the new auction. Entity: ', JSON.stringify(entity));
          var o = modelParser.prepare(entity, true);

          //the expiresOn attribute is computed based on startDate and auction duration (in seconds)
          var startDate = new Date(o.startDate);
          o.expiresOn = new Date(startDate.getTime()).setSeconds(startDate.getSeconds() + o.duration);

          logger.debug('Entity  after prepare: ', JSON.stringify(o));
          return auctionDAO.save(o)
            .then(function(r) {
              resolve(modelParser.clear(r));
            })
            .catch(reject);
        } else {
          reject({
            status: 401
          });
        }
      });
    },

    update: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        if (userHelper.isAdministrator(self.currentUser)) {
          logger.debug('Update the auction. Entity: ', JSON.stringify(entity));
          var o = modelParser.prepare(entity, false);
          logger.debug('Entity  after prepare: ', JSON.stringify(o));
          return auctionDAO.update(o)
            .then(function(r) {
              return self.getById(r._id);
            })
            .then(resolve)
            .catch(reject);
        } else {
          reject({
            status: 401
          });
        }
      });
    },

    getById: function(id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        if (userHelper.isAdministrator(self.currentUser)) {
          return auctionDAO.getById(id)
            .then(function(r) {
              if (r) {
                resolve(modelParser.clear(r));
              } else {
                throw {
                  status: 404,
                  message: 'Auction not found'
                };
              }
            })
            .catch(reject);
        } else {
          reject({
            status: 401
          });
        }
      });
    },

    delete: function(id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getById(id)
          .then(function(auction) {
            if (!auction) {
              throw {
                status: 404,
                message: 'User not found'
              };
            } else {
              return auctionDAO.disable(id);
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    addBid: function(auctionId, userId, connectionInfo) {
      var self = this;

      return new Promise(function(resolve, reject){
        var currentAuction = null;
        var chain = Promise.resolve();
        var now = new Date();

        logger.info('Starting the process of bid', auctionId, userId, connectionInfo);

        chain
          .then(function() {
            return self.getById(auctionId);
          })
          .then(function(auction) {
            currentAuction = auction;

            if (!currentAuction) {
              throw {
                status: 404,
                message: 'Auction not found'
              };
            } else if (new Date(currentAuction.expiresOn).getTime() < now.getTime()) {
              throw {
                status: 409,
                message: 'This auction is not open for bids'
              };
            } else {
              return userBO.addTransaction(userId, {
                transactionType: 0,
                date: new Date(),
                coins: 1,
                auctionId: auction.id,
                description: 'Bid on ' + auction.product.name
              });
            }
          })
          .then(function(user) {
            auctionDAO.addBid(currentAuction, {
              user: {
                id: user.id,
                name: user.name
              },
              value: user.wallet.averageValue,
              date: new Date(),
              ip: connectionInfo.ip,
              userAgent: connectionInfo.userAgent
            });
          })
          .then(function() {
            resolve();
          })
          .catch(reject);
      });
    }
  };
};
