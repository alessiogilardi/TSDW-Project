//const mongoose  = require('mongoose');
//const schemas   = require('./schemas.js');
const models    = require('./models.js');
const db        = require('./db-connect.js');
const queries   = require('./queries.js');

var mongoose = db.connect();

//queries.createAirOperator("oName", "oCountry", "oCity", "oAddress");



var edited = {country: 'Australia', city: 'Genoa'};

queries.updateAirOperatorByName('oName', edited);

db.disconnect();