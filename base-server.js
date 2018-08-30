require('dotenv').config();
var fs = require('fs'); 
var https = require('https'); 
var http  = require('http');

var port    = process.env.PORT || 89;
var options = { 
    key: fs.readFileSync('encryption/server-key.pem'), 
    cert: fs.readFileSync('encryption/server-crt.pem'), 
    ca: fs.readFileSync('encryption/ca-crt.pem'), 
};


https.createServer(options, (request, response) => {
    var body = '';
	request.on('error', err => {
		console.error(err);
	}).on('data', chunck => {
		body += chunck.toString();
        console.log("Chunk");
	}).on('end', () => {
        console.log('Message');
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end();
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