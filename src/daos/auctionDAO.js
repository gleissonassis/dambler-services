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

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        logger.info('Getting auctions from database', filter);

        model.find(filter, projectionCommonFields)
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

    getOnlineAuctions: function() {
      return this.getAll({
        isEnabled: true,
        startDate: {
          '$gt': Date.now()
        }
      });
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

    getById: function(id) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.log('info', 'Getting an auction by id %s', id);

        self.getAll({_id: id, isEnabled: true})
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
        logger.log('info', 'Adding bid for the auction', auctionId, bid);

        var startDate = new Date(auction.startDate);
        auction.expiresOn = new Date(startDate.getTime()).setSeconds(startDate.getSeconds() + auction.duration);

        //updating the bid and the new expires date
        model.findByIdAndUpdate(auction.id,
          {$push: {bids: bid},
          $set:{'expiresOn': auction.expiresOn}},
          {'new': true, fields: projectionCommonFields})
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
