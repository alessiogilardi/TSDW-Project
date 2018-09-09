const models    = require('./models.js');
const db        = require('./db-connect.js');
const queries   = require('./queries.js');

var mongoose = db.connect();

//queries.AirOperator.insert('eurodrone', 'Italy', 'Genoa', 'Corso Europa 22');



//var edited = {'location.city': 'sfsdsdfds'};

//queries.AirOperator.updateByName('qwe', edited);

//queries.Base.insert("Base 3", 'eurodrone' , "Italy", "La Speza", "22", "22");


models.Base.findOne()
.populate('airOperator')
.exec((err, res) => {
	console.log(res);
});



db.disconnect();