module.exports = function() {
  return {
    clear: function(entity) {
      var o = Object.assign({}, entity);

      if (o._id) {
        o.id = o._id.toString();
      }
      delete o._id;
      delete o.isEnabled;
      delete o.__v;

      return o;
    },

    clearUser: function(user) {
      var o = Object.assign({}, this.clear(user));
      delete o.password;

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
      } else {
        o._id = o.id;
        delete o.id;
      }

      if (o.isEnabled === undefined) {
        o.isEnabled = true;
      }

      return o;
    }
  };
};
