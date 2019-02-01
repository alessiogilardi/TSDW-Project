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
/**
 * Funzione che si occupa dell'inizializzazione del database
 */
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

    await db.disconnect()
}

init()