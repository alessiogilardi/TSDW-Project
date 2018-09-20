/**
 * Modulo che conserva i vari Models della struttura del DB
**/
const mongoose  = require('mongoose');
const schemas   = require('./schemas.js');

exports.AirOperator = mongoose.model('air_operator', schemas.airOperatorSchema);
exports.Personnel   = mongoose.model('personnel', schemas.personnelSchema);
exports.Base        = mongoose.model('base', schemas.basesSchema);
exports.Drone       = mongoose.model('drone', schemas.dronesSchema);
exports.Battery     = mongoose.model('battery', schemas.batterySchema);
exports.Mission     = mongoose.model('mission', schemas.missionsSchema);
exports.Logbook     = mongoose.model('logbook', schemas.logbooksSchema);
exports.Qtb         = mongoose.model('qtb', schemas.qtbSchema);
