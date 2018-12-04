/**
 * Modulo che inizializza il db
 */
require('dotenv').config({ path: '.././.env' })
const db 	    = require('./db-connect.js')
const models    = require('./models.js')
const queries   = require('./queries.js')
const docs      = require('./db-documents.js')
const eventEmitters = require('../events/event-emitters')

const AirOperator = queries.AirOperator
const Personnel   = queries.Personnel
const Drone       = queries.Drone
const Base        = queries.Base

const init = async () => {
    await db.connect(process.env.DB_ADDRESS, process.env.DB_PORT, process.env.DB_NAME)

    for (let airOperator of docs.AirOperators) {
        await AirOperator.insert(airOperator)
    }

    for (let base of docs.Bases) {
        await Base.insert(base)
    }

    for (let person of docs.Personnel) {
        await Personnel.insert(person)
    }

    for (let drone of docs.Drones) {
        await Drone.insert(drone)
    }
    /*
    await docs.AirOperators.forEach(async airOperator => { await AirOperator.insert(airOperator)})
    await docs.Bases.forEach(async base => {await Base.insert(base)})
    await docs.Personnel.forEach(async person => {await Personnel.insert(person)})
    await docs.Drones.forEach(async drone => await  Drone.insert(drone))
    */

    await db.disconnect()
}

init()
/*
var count = 0;
db.connect(process.env.DB_ADDRESS, process.env.DB_PORT, process.env.DB_NAME)
.then(() => {
	docs.AirOperators.forEach(airOperator => AirOperator.insert(airOperator))
    eventEmitters.db.AirOperator.on('insert', airOperator => docs.Bases.forEach(base => Base.insert(base)))
    eventEmitters.db.Base.on('insert', base => {
        count++
        if (count === docs.Bases.length) {
            docs.Personnel.forEach(person => Personnel.insert(person))
            docs.Drones.forEach(drone => Drone.insert(drone))
        }
    })
})

*/