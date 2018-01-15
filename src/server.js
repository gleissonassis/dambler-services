var http    = require('http');
var app     = require('./config/express')();
              require('./config/database.js')();
var Starter = require('./starter');


var server = http.createServer(app).listen(app.get('port'), function() {
    console.log('Express is running on port ' + app.get('port'));

    var starter = new Starter();
    starter.configureApplication();
});

module.exports = server;
