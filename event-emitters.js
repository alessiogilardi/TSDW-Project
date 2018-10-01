const events = require('events')

const emitters = {
    AirOperator: new events.EventEmitter(),
    Base: new events.EventEmitter(),
    Personnel: new events.EventEmitter(),
    Drone: new events.EventEmitter(),
    Battery: new events.EventEmitter(),
    Mission: new events.EventEmitter(),
    Logbook: new events.EventEmitter(),
    Qtb: new events.EventEmitter()
}

module.exports = emitters