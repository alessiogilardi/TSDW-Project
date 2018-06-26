require('dotenv').config();
var http  = require('http');
var https = require('https');

var port = process.env.PORT;
var telegramApiToken = process.env.TELEGRAM_API_TOKEN;


var message = '';

function parseRequestData(request, callback) {
    var body = '';
    request.on('data', chunk => {
        body += chunk.toString();
    });
    request.on('end', () => {
    	callback(JSON.parse(body));
    });
}

const requestHandler = (request, response) => {
    console.log(request.url);
    if (request.method == 'POST') {
        parseRequestData(request, result => {
            console.log(result);
            response.writeHead(200);
            response.end('OK');
        });
    } else {
    	response.writeHead(200);
        response.end("No data, use POST!");
    }
}

const server = http.createServer(requestHandler);
server.listen(port, err => {
    if (err) {
        console.log('Something went worng', err);
    }
    console.log('Listening on port: ' + port);
});