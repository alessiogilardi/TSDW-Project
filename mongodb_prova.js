const models    = require('./models.js');
const db        = require('./db-connect.js');
const queries   = require('./queries.js');

var mongoose = db.connect();

//queries.AirOperator.insert('eurodrone', 'Italy', 'Genoa', 'Corso Europa 22');



//var edited = {'location.city': 'sfsdsdfds'};

//queries.AirOperator.updateByName('qwe', edited);

queries.Base.insert("Base 1", 'eurodrone' , "Italy", "La Spezia", "22", "22");


db.disconnect();