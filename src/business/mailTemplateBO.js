var Promise         = require('promise');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var mailTemplateDAO = dependencies.mailTemplateDAO;
  var modelParser = dependencies.modelParser;

  return {
    dependencies: dependencies,

    clear: function() {
      return mailTemplateDAO.clear();
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        filter.isEnabled = true;
        logger.info('Listing all mail templates by filter ', filter);
        mailTemplateDAO.getAll(filter)
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
          .then(function(mailTemplate) {
            if (!mailTemplate) {
              logger.debug('Saving the mail template. Entity: ', JSON.stringify(entity));
              var o = modelParser.prepare(entity, true);
              logger.debug('Entity  after prepare: ', JSON.stringify(o));
              return mailTemplateDAO.save(o);
            } else {
              throw {
                status: 409,
                message: 'The key ' + entity.key + ' is already in use by other mail template'
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
          .then(function(mailTemplate) {
            if (!mailTemplate || (mailTemplate && mailTemplate.id === entity.id)) {
              return mailTemplateDAO.update(o);
            } else {
              throw {
                status: 409,
                message: 'The key ' + entity.key + ' is already in use by other mail template'
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
        mailTemplateDAO.getById(id)
          .then(function(mailTemplate) {
            if (mailTemplate) {
              return modelParser.clear(mailTemplate);
            } else {
              throw {
                status: 404,
                message: 'Template not found'
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
          .then(function(mailTemplates) {
            if (mailTemplates.length) {
              logger.info('Mail template found by key', JSON.stringify(mailTemplates[0]));
              return mailTemplates[0];
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
          .then(function(mailTemplate) {
            if (!mailTemplate) {
              throw {
                status: 404,
                message: 'Template not found'
              };
            } else {
              return mailTemplateDAO.disable(id);
            }
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
