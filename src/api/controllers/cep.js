var request = require('request');

module.exports = function() {
  return {
    getCEPInfo: function(req, res) {
      request({
        method: 'GET',
        uri: 'https://viacep.com.br/ws/' + req.params.cep + '/json/',
        json: true
      },
      function (error, response, body) {
        if (error) {
          res.status(500).json(error);
        } else {
          res.status(200).json(body);
        }
      });
    },
  };
};
