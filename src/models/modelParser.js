module.exports = function() {
  return {
    clear: function(entity) {
      var o = Object.assign({}, entity);

      if (o._id) {
        o.id = o._id.toString();
      }
      delete o._id;

      return o;
    },

    clearUser: function(user) {
      var o = Object.assign({}, this.clear(user));

      return o;
    },

    prepare: function(entity, isNew) {
      var o = Object.assign({}, entity);

      if (isNew) {
        if (o._id !== undefined) {
          delete o._id;
        }
        if (o.id !== undefined) {
          delete o.id;
        }

        o.isEnabled = true;
      } else {
        o._id = o.id;
        delete o.id;
        delete o.isEnabled;
      }

      return o;
    }
  };
};
