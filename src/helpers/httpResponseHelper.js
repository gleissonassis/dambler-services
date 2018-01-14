module.exports = function(req, res){
  var _status = function(status, r) {
    console.log(status, r);
    res.status(status).json(r || {});
  };

  return {
    error: function(e) {
      if (e && e.status) {
        if (e.status === 401 && !e.message) {
          e.message = 'You do not have valid authentication credentials for the target resource';
        }
        _status(e.status, e);
      } else {
        _status(500, e);
      }
    },

    created: function(r) {
      _status(201, r);
    },

    ok: function(r) {
      if (!r || (r && Array.isArray(r) && r.length === 0)) {
        _status(404, r);
      } else {
        _status(200, r);
      }
    },

    notFound: function(r) {
      _status(404, r);
    },
  };
};
