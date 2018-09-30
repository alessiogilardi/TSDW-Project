require('./db-connect.js').connect()
const models    = require('./models.js')
const queries   = require('./queries.js')
const docs      = require('./db-documents.js')

//ocs.AirOperators.forEach(airOperator => queries.AirOperator.insert(airOperator))
//docs.Bases.forEach(base => queries.Base.insert(base))
//docs.Personnel.forEach(person => queries.Personnel.insert(person))
docs.Drones.forEach(drone => queries.Drone.insert(drone))