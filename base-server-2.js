require('dotenv').config();
var http  = require('http');
var https = require('https');
var rl    = require('./httpRequestListener');

var port         = process.env.PORT || 8080;
var teleApiToken = process.env.TELEGRAM_API_TOKEN;

http.createServer(rl.listener)
    .on('connection', () => {
        console.log(' > Host connected');
    })
    .listen(port, err => {
        if (err) {
            console.error(err);
        } else {
            console.log('Started Node.js WebServer');
            console.log(' > Listening on port: ' + port + '\n');
        }
    });