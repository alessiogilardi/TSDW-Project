// Cloudno.de API Token 6QIh5VfMVE


var http = require('http');
var https = require('https');
var util = require('util');
var querystring = require('querystring');
var app_port = process.env.app_port || 8080;
var app_host = process.env.app_host || '127.0.0.1';

var TELEGRAM_API_TOKEN = '581096992:AAFzUXEWPZnMYP-2_uVBLwRYRkz53wC0sVc';


const mongoose = require('mongoose');
mongoose.connect('mongodb://alessio.gilardi91:an2TCoxlcC@mongodb.cloudno.de:27017');

const Cat = mongoose.model('Cat', { name: String });

const kitty = new Cat({ name: 'Zildjian' });
kitty.save().then(() => console.log('meow'));




function sendMessage(chatID, text) {
    https.get('https://api.telegram.org/bot'+ TELEGRAM_API_TOKEN +'/sendMessage?chat_id='+ chatID +'&text='+ text, (resp) => {
 
      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        //console.log(JSON.parse(chunk));
      });
 
      resp.on('end', () => {
      });
 
    }).on("error", (err) => {
    });

}



http.createServer()
  .on('request', function (req, res) {
    if (req.method == 'POST') {
      var body = '';
      req.on('data', function (data) {
        body += data;
      });

      req.on('end', function () {
        var post = JSON.parse(body);
        var chatID = post.message.chat.id;
        var text = post.message.text;
        sendMessage(chatID, text);
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end();
      });
    } else {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end();
    }
  })
  .listen(app_port);

console.log('Web server running at http://' + app_host + ':' + app_port);