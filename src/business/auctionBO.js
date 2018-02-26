var Promise         = require('promise');
var logger          = require('../config/logger');
var mongoose        = require('mongoose');

module.exports = function(dependencies) {
  var auctionDAO = dependencies.auctionDAO;
  var modelParser = dependencies.modelParser;
  var userHelper = dependencies.userHelper;
  var userBO = dependencies.userBO;

  return {
    currentUser: {},
    dependencies: dependencies,

    setCurrentUser: function(currentUser) {
      this.currentUser = currentUser;
      userBO.setCurrentUser(currentUser);
    },

    clear: function() {
      return auctionDAO.clear();
    },

    parserAuction: function(item) {
      var auction = modelParser.clear(item);
      //the bid must start at least 0.01
      auction.value = (auction.bids ? (auction.bids.length * 0.01) : 0) + 0.01;
      //getting the last 10 bids
      auction.bids.reverse();
      auction.bids = auction.bids.slice(0, 10).map(function(item, index) {
        item.index = index + 1;
        return item;
      });
      auction.isExpired = new Date(auction.expiresOn).getTime() < new Date().getTime();
      return auction;
    },

    getAll: function(category) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();
        var auctions = {
          open: [],
          closed: []
        };

        chain
          .then(function() {
            return self.getOpenAuctions(category);
          })
          .then(function(r) {
            auctions.open = r;
            return self.getClosedAuctions(category, 10);
          })
          .then(function(r) {
            auctions.closed = r;
            return auctions;
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getOnlineAuctions: function(category) {
      var self = this;

      return new Promise(function(resolve, reject) {
        auctionDAO.getOnlineAuctions(category)
          .then(function(r) {
            resolve(r.map(function(item) {
              return self.parserAuction(item);
            }));
          })
          .catch(reject);
      });
    },

    getOpenAuctions: function(category) {
      var self = this;

      return new Promise(function(resolve, reject) {
        auctionDAO.getOpenAuctions(category)
          .then(function(r) {
            resolve(r.map(function(item) {
              return self.parserAuction(item);
            }));
          })
          .catch(reject);
      });
    },

    getClosedAuctions: function(category, limit) {
      var self = this;

      return new Promise(function(resolve, reject) {
        auctionDAO.getClosedAuctions(category, limit)
          .then(function(r) {
            resolve(r.map(function(item) {
              return self.parserAuction(item);
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

          //the bids array can not be modified directly by a request
          //This arrya can be modified just by adding a new bid transaction
          delete o.bids;

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

          //the expiresOn attribute is computed based on startDate and auction duration (in seconds)
          var startDate = new Date(o.startDate);
          o.expiresOn = new Date(startDate.getTime()).setSeconds(startDate.getSeconds() + o.duration);

          //the bids array can not be modified directly by a request
          //This arrya can be modified just by adding a new bid transaction
          delete o.bids;

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
        if (mongoose.Types.ObjectId.isValid(id)) {
          auctionDAO.getById(id, true)
            .then(function(r) {
              if (r) {
                var auction = self.parserAuction(r);
                resolve(auction);
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
            status: 404,
            message: 'Auction not found',
            id: id
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
              logger.warn('A bid was performed to a closed auction', currentAuction.expiresOn, now);
              throw {
                status: 409,
                message: 'This auction is not open for bids'
              };
            } else {
              return userBO.addTransaction(userId, {
                transactionType: 0,
                coins: 1,
                auctionId: auction.id,
                description: 'Bid on ' + auction.product.name
              });
            }
          })
          .then(function(user) {
            return auctionDAO.addBid(currentAuction, {
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
          .then(function(r) {
            logger.info('The bid transaction has beed done succesfully', JSON.stringify(r));
            return true;
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
