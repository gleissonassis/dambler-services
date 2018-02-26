var Promise         = require('promise');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var coinPackageDAO = dependencies.coinPackageDAO;
  var modelParser = dependencies.modelParser;

  return {
    dependencies: dependencies,

    clear: function() {
      return coinPackageDAO.clear();
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        filter.isEnabled = true;
        logger.info('Listing all coin packages by filter ', filter);
        coinPackageDAO.getAll(filter)
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
        self.getByKey(entity.key)
          .then(function(coinPackage) {
            if (!coinPackage) {
              logger.debug('Saving the coin package. Entity: ', JSON.stringify(entity));
              var o = modelParser.prepare(entity, true);
              logger.debug('Entity  after prepare: ', JSON.stringify(o));
              return coinPackageDAO.save(o);
            } else {
              throw {
                status: 409,
                message: 'The key ' + entity.key + ' is already in use by other coin package'
              };
            }
          })
          .then(function(r) {
            resolve(modelParser.clear(r));
          })
          .catch(reject);
      });
    },

    update: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var o = modelParser.prepare(entity, false);
        self.getByKey(entity.key)
          .then(function(coinPackage) {
            if (!coinPackage || (coinPackage && coinPackage.id === entity.id)) {
              return coinPackageDAO.update(o);
            } else {
              throw {
                status: 409,
                message: 'The key ' + entity.key + ' is already in use by other coin package'
              };
            }
          })
          .then(function(r) {
            resolve(modelParser.clear(r));
          })
          .catch(reject);
      });
    },

    getById: function(id) {
      return new Promise(function(resolve, reject) {
        coinPackageDAO.getById(id)
          .then(function(coinPackage) {
            if (coinPackage) {
              return modelParser.clear(coinPackage);
            } else {
              throw {
                status: 404,
                message: 'Coin package not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getByKey: function(key) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var filter = {
          key: key
        };

        self.getAll(filter)
          .then(function(coinPackages) {
            if (coinPackages.length) {
              logger.info('Coin package found by key', JSON.stringify(coinPackages[0]));
              return coinPackages[0];
            } else {
              return null;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    delete: function(id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getById(id)
          .then(function(coinPackage) {
            if (!coinPackage) {
              throw {
                status: 404,
                message: 'Coin package not found'
              };
            } else {
              return coinPackageDAO.disable(id);
            }
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
