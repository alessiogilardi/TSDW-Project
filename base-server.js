//require('dotenv').config();
var http  = require('http');
//var https = require('https');

//var port             = process.env.PORT || 88;
//var telegramApiToken = process.env.TELEGRAM_API_TOKEN;
var port             = 88;


http.createServer((request, response) => {
    var body = '';
	request.on('error', err => {
		console.error(err);
	}).on('data', chunck => {
		body += chunck.toString();
	}).on('end', () => {
        console.log(body)
        /*
		if (request.method === 'POST' && request.headers['content-type'] === 'application/json') {
			try {
				body = JSON.parse(body);
				response.writeHead(200, {'Content-Type': 'application/json'});
				response.write(JSON.stringify(body));
                console.log(JSON.stringify(body))
				response.end();
			} catch(e) {
                console.log(e);
                response.writeHead(500);
                response.end();
			}
		} else {
			response.writeHead(200, {'Content-Type': 'text/plain'});
			response.write('Use POST');
			response.end();
		}
        */
	})

}).listen(port, err => {
	if (err) {
		console.error(err);
	} else {
		console.log('Server started');
		console.log('Listeninig on port: ' + port)
	}
});

/*
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
*/