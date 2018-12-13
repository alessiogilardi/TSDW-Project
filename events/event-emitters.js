/**
 * Modulo che contiene gli EventEmitters per varie entità.
 * Eventi per il db e per il bot.
 */
const events       = require('events')
const EventEmitter = events.EventEmitter

const emitters = {
    db: {
        AirOperator: new EventEmitter(),
        Base:        new EventEmitter(),
        Personnel:   new EventEmitter(),
        Drone:       new EventEmitter(),
        Battery:     new EventEmitter(),
        Mission:     new EventEmitter(),
        Logbook:     new EventEmitter(),
        Qtb:         new EventEmitter()
    },
    bot: new EventEmitter()
}

module.exports = emitters
