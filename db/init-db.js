const models    = require('./models.js');
const db        = require('./db-connect.js');
const queries   = require('./queries.js');
const docs      = require('./db-documents.js');

var mongoose = db.connect();


//queries.AirOperator.insert(docs.AirOperators[0]);
/*
docs.Bases.forEach(base => {
    queries.Base.insert(base);
});
*/
/*
docs.Personnel.forEach(person => {
    queries.Personnel.insert(person);
});
*/
//queries.Base.insert(docs.Bases[1])

//queries.Personnel.insert(docs.Personnel[1]);
//queries.Personnel.findByIdTelegram(33017299, {}, aPerson => console.log(aPerson))

docs.Drones.forEach(drone => queries.Drone.insert(drone))