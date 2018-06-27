var body = '';

exports.listener = (request, response) => {
    request.on('error', error => {
        console.error(error);
    }).on('data', chunk => {
        body += chunk.toString();
    }).on('end', () => {
        response.writeHead(200);
        response.end();
    });
}


