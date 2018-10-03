require('./db-connect.js').connect()
const models    = require('./models.js')
const queries   = require('./queries.js')
const docs      = require('./db-documents.js')
const eventEmitters = require('../event-emitters')

var count = 0;

docs.AirOperators.forEach(airOperator => queries.AirOperator.insert(airOperator))
eventEmitters.AirOperator.on('insert', airOperator =>docs.Bases.forEach(base => queries.Base.insert(base)))
eventEmitters.Base.on('insert', base => {
    count++
    if (count === docs.Bases.length) {
        docs.Personnel.forEach(person => queries.Personnel.insert(person))
        docs.Drones.forEach(drone => queries.Drone.insert(drone))
    }
})