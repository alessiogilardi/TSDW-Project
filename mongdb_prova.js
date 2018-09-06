var mongoose = require('mongoose');
var schemas = require('./schemas.js');


mongoose.connect('mongodb://localhost:27017/TSDW', {useNewUrlParser: true});


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected!');
  //schemas.newOperatore('aaa', 'bbb', 'ccc', 'ddd');
});

schemas.newOperatore('2222', '2222bbb', '2222ccc', '2222ddd');

setTimeout(() => {
  mongoose.disconnect();
}, 1500);