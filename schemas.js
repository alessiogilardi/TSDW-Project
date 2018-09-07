/**
 * Modulo che conserva i vari Schema della struttura del DB
**/

const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

exports.airOperatorSchema = new mongoose.Schema({
  _id: ObjectId,
  name: {type: String, unique: true},
  location: {
    country: String,
    city: String,
    address: String
  },
  roles: {
    AM: {type: ObjectId, default: null},
    CQM: {type: ObjectId, default: null},
    SM: {type: ObjectId, default: null}
  },
  bases: [{type: ObjectId, default: []}]
});

exports.personnelSchema = new mongoose.Schema({
    _id: ObjectId,
    idTelegram: String,
    name: String,
    surname: String,
    cf: {type: String, unique: true},
    location: {
        country: String,
        city: String,
        address: String
    },
    airOperator: ObjectId,
    base: ObjectId,
    roles: [String],
    missions: [{type: ObjectId, default: []}],
    locPermission: {type: Boolean, default: false},
    pilotInfo: {
        license: {
            id: {type: String, default: null},
            type: {type: String, default: null},
            expiring: {type: Date, default: null}
        },
        droneTypes: [{type: String, default: null}]
                                      
    }
});

exports.basesSchema = new mongoose.Schema({
    _id: ObjectId ,
    name: {type: String, unique: true},
    airOperator: ObjectId,
    location: {
        country: String,
        city: String,
        address: String,
        latitude: Number,
        longitude: Number
    },
    roles: {
        ViceAM: {type: ObjectId, default: null},
        BaseSupervisor: {type: ObjectId, default: null}
    },
    staff: {
        pilots: [{type: ObjectId, default: []}],
        equip: [{type: ObjectId, default: []}],
        mainteiners: [{type: ObjectId, default: []}]
    },
    drones: [{type: ObjectId, default: []}]
});

exports.dronesSchema = new mongoose.Schema({
    _id: ObjectId,
    number: {type: String, unique: true}, /* Non sapendo se sia numerico o alfanumerico */
    type: String,
    operator: ObjectId,
    base: ObjectId,
    state: {
        generalState: String,
        lastMaintenance: Date,
        notes: String
    },
    missions: [{type: ObjectId, default: []}]
});

exports.missionsSchema = new mongoose.Schema({
    id: ObjectId,
    date: Date,
    location: {
        latitude: Number,
        longitude: Number
    },
    type: String,
    base: ObjectId,
    supervisor: ObjectId,
    duration: {
        expectedDuration: Number,
        effectiveDuration: Number
    },
    description: String,
    flightPlan: String,
    drones: [ObjectId],
    pilots: [ObjectId],
    equip: [ObjectId],
    mainteiners: [{type: ObjectId, default: []}],
    logbooks: [{type: ObjectId, default: []}],
    qtb: [{type: ObjectId, default: []}]
});

exports.logbooksSchema = new mongoose.Schema({
    _id: ObjectId,
    pilotWriter: ObjectId,
    mission: ObjectId,
    info: {
        flightTime: Number,
        notes: String
    }
});

exports.qtbSchema = new mongoose.Schema({
    _id: ObjectId,
    drone: ObjectId,
    mission: ObjectId,
    info: {
        fligthTime: Number,
        notes: String
    }
});