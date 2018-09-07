const models    = require('./models.js');
const db        = require('./db-connect.js');
const queries   = require('./queries.js');

var mongoose = db.connect();

//queries.AirOperator.create('qwe', 'sss', 'sss', 'sss');



var edited = {'location.city': 'sfsdsdfds'};

queries.AirOperator.updateByName('qwe', edited);


db.disconnect();