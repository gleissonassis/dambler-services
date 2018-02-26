module.exports = function() {
  return {
    escapeRegExp: function(str) {
      return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    },

    replaceAll: function(str, find, replace) {
      return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
    }
  };
};
