var logger        = require('../config/logger');

module.exports = function(dependencies) {
  var stringReplacerHelper = dependencies.stringReplacerHelper;

  return {
    entities: {},
    parse: function(text) {
      if (typeof text === 'string') {
        return this._parse(0, this.entities, '', text, false);
      } else {
        return text;
      }
    },

    evaluate: function(text) {
      try {
        return eval(this._parse(0, this.entities, '', text, true));
      } catch (e) {
        logger.log('warn','An error has occurred whiling evaluating the expression %s', text, e);
        return false;
      }
    },

    parseText: function(obj, key, text, toEvaluate) {
      if (toEvaluate && typeof obj === 'string') {
        return stringReplacerHelper.replaceAll(text, key, '"' + obj.toString() + '"');
      } else {
        return stringReplacerHelper.replaceAll(text, key, obj.toString());
      }
    },

    _parse: function(index, rootObject, rootName, text, toEvaluate) {
      if (!this.entities || index > 10) {
        return text;
      }

      for (var element in rootObject) {
        var key = '${' + rootName + element + '}';

        logger.log('debug', 'Searching for the key %s', key);

        if (rootObject[element]) {
          if (this.isPrimitive(rootObject[element])) {
            text = this.parseText(rootObject[element], key, text, toEvaluate);
          } else {
            text = this._parse(index + 1, rootObject[element], rootName + element + '.', text, toEvaluate);
          }
        } else {
          text = stringReplacerHelper.replaceAll(text, key, '');
        }
      }

      return text;
    },

    isPrimitive: function(test) {
        return (test !== Object(test) && (typeof test) != 'object');
    },
  };
};
