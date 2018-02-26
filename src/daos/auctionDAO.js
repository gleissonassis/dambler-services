var logger              = require('winston');
var model               = require('../models/auction')();
var Promise             = require('promise');
var $                   = require('mongo-dot-notation');

module.exports = function() {
  var projectionCommonFields = {
    __v: false,
    isEnabled: false,
    bids: false,
  };

  var projectionAllFields = {
    __v: false,
    isEnabled: false,
    'bids.value': false,
    'bids.userAgent': false,
    'bids.ip': false,
    //'bids.date': false,
    'bids._id': false
  };

  return {
    clear: function() {
      return new Promise(function(resolve, reject) {
        model.remove({}, function(err) {
          if (err) {
            logger.log('error', 'An error has occurred while deleting all auctions', error);
            reject(err);
          } else {
            logger.log('info', 'The auctions have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getAll: function(filter, allFields, sort, limit) {
      return new Promise(function(resolve, reject) {
        logger.info('Getting auctions from database', filter);

        var projection = allFields ? projectionAllFields : projectionCommonFields;

        var sortAndLimit = {};

        if (limit) {
          sortAndLimit.limit = limit;
        }

        if (sort) {
          sortAndLimit.sort = sort;
        }

        if (!filter.category) {
          delete filter.category;
        }

        logger.debug('Select projection & sort for listing auctions', projection, sortAndLimit);

        model.find(filter, projection, sortAndLimit)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('%d auctions were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.log('error', 'An error has ocurred while getting auctions from database', erro);
            reject(erro);
          });
      });
    },

    getOnlineAuctions: function(category) {
      return this.getAll({
        isEnabled: true,
        isPublished: true,
        category: category,
        startDate: {
          '$lt': Date.now()
        },
        expiresOn: {
          '$gt': Date.now()
        }
      }, true, {'startDate': 1});
    },

    getOpenAuctions: function(category) {
      return this.getAll({
        isEnabled: true,
        isPublished: true,
        category: category,
        expiresOn: {
          '$gt': Date.now()
        }
      }, true, {'startDate': 1});
    },

    getClosedAuctions: function(category, limit) {
      return this.getAll({
        isEnabled: true,
        isPublished: true,
        category: category,
        expiresOn: {
          '$lte': Date.now()
        }
      }, true, {'startDate': -1}, limit);
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Creating a new auction', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.log('info', 'The auction has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('An error has ocurred while saving a new auction', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },


    update: function(entity) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Update an auction');

        model.findByIdAndUpdate(entity._id, $.flatten(entity), {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.log('info', 'The auction has been updated succesfully');
          logger.debug(JSON.stringify(item.toObject()));
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while updating an auction', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    getById: function(id, allFields) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Getting an auction by id %s', id);

        self.getAll({_id: id, isEnabled: true}, allFields)
        .then(function(auctions) {
          if (auctions.length === 0) {
            logger.info('Auction not found');
            resolve(null);
          } else {
            logger.info('The auction was found');
            logger.debug(JSON.stringify(auctions[0]));
            resolve(auctions[0]);
          }
        }).catch(function(erro) {
            logger.log('error', 'An error has occurred while geeting an auction by id %s', id, erro);
            reject(erro);
        });
      });
    },

    disable: function(id) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Disabling an auction');

        model.findByIdAndUpdate(id, {_id:id, isEnabled: false}, {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.log('info', 'The auction has been disabled succesfully');
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while disabling an auction', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    addBid: function(auction, bid) {
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Adding bid for the auction', auction.id, bid);

        var expiresOn = new Date(auction.expiresOn);
        var startDate = new Date(auction.startDate);
        var now = new Date();
        var diff = (expiresOn.getTime() - now.getTime()) / 1000;

        if (startDate.getTime() > now.getTime() || diff >= auction.duration) {
          auction.expiresOn = expiresOn;
        } else {
          //must be added just the amount to expire the auction
          auction.expiresOn = new Date(expiresOn.getTime())
                                  .setSeconds(expiresOn.getSeconds() + auction.duration - diff);
        }

        //updating the bid and the new expires date
        model.findByIdAndUpdate(auction.id,
          {$push: {bids: bid},
          $set:{'expiresOn': auction.expiresOn}},
          {'new': true, fields: projectionAllFields})
        .then(function(item) {
          logger.log('info', 'The bids has been updated succesfully');
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while updating the bids', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },
  };
};
