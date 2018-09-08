const models    = require('./models.js');
const db        = require('./db-connect.js');
const queries   = require('./queries.js');

var mongoose = db.connect();

// queries.AirOperator.create('eurodrone', 'Italy', 'Genoa', 'Corso Europa 22');



//var edited = {'location.city': 'sfsdsdfds'};

//queries.AirOperator.updateByName('qwe', edited);

queries.Base.create("Base 1", mongoose.Types.ObjectId("5b93f7150c9e841c0c864246") , "Italy", "La Spezia", "22", "22");


db.disconnect();