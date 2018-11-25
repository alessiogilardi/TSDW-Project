/**
 * Modulo che conserva i vari Models della struttura del DB
**/
const mongoose  = require('mongoose')
const model     = mongoose.model
const schemas   = require('./schemas.js')

exports.AirOperator = model('air_operator', schemas.airOperatorSchema)
exports.Personnel   = model('personnel', schemas.personnelSchema)
exports.Base        = model('base', schemas.basesSchema)
exports.Drone       = model('drone', schemas.dronesSchema)
exports.Battery     = model('battery', schemas.batterySchema)
exports.Mission     = model('mission', schemas.missionsSchema)
exports.Logbook     = model('logbook', schemas.logbooksSchema)
exports.Qtb         = model('qtb', schemas.qtbSchema)
exports.EventLog    = model('eventLog', schemas.eventLogSchema)