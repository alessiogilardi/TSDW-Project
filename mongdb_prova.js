//const mongoose  = require('mongoose');
//const schemas   = require('./schemas.js');
const models    = require('./models.js');
const db        = require('./db-connect.js');

var mongoose = db.connect();

var mOperator = new models.AirOperator({
        _id: new mongoose.Types.ObjectId(),
        name: "mName",
        location: {
          country: "mCountry",
          city: "mCity",
          address: "mAddress"
        }
    });

mOperator.save((err) => {
  if (err)
    return console.log(err);
});

db.disconnect();

/*
mongoose.connect('mongodb://localhost:27017/TSDW', {useNewUrlParser: true});


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected!');
});
*/

// schemas.newOperatore('2222', '2222bbb', '2222ccc', '2222ddd');

/*
setTimeout(() => {
  mongoose.disconnect();
}, 1500);
*/