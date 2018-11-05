/**
 * Modulo che contiene gli EventEmitters per varie entità.
 * Eventi per il db e per il bot.
 */
const events = require('events')

const emitters = {
    Db: {
        AirOperator: new events.EventEmitter(),
        Base: new events.EventEmitter(),
        Personnel: new events.EventEmitter(),
        Drone: new events.EventEmitter(),
        Battery: new events.EventEmitter(),
        Mission: new events.EventEmitter(),
        Logbook: new events.EventEmitter(),
        Qtb: new events.EventEmitter()
    },
    Bot: new events.EventEmitter()
}

module.exports = emitters