/**
 * Modulo che conserva i vari Schema della struttura del DB
**/

const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

exports.airOperatorSchema = new mongoose.Schema({
  _id: ObjectId,
  name: String,
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
  bases: [{type: ObjectId, default: null}]
});

exports.personnelSchema = new mongoose.Schema({
    _id: ObjectId,
    idTelegram: String,
    name: String,
    surname: String,
    cf: String,
    location: {
        country: String,
        city: String,
        address: String
    },
    airOperator: ObjectId,
    base: ObjectId,
    roles: [String],
    missions: [ObjectId],
    locPermission: Boolean,
    pilotInfo: {
        license: {
            id: String,
            type: String,
            expiring: Date
        },
        droneTypes: [String]
    }
});

exports.basesSchema = new mongoose.Schema({
    _id: ObjectId ,
    name: String,
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
        pilots: [{type: ObjectId, default: null}],
        equip: [{type: ObjectId, default: null}],
        mainteiners: [{type: ObjectId, default: null}]
    },
    drones: [{type: ObjectId, default: null}]
});

exports.dronesSchema = new mongoose.Schema({
    _id: ObjectId,
    number: String, /* Non sapendo se sia numerico o alfanumerico */
    type: String,
    operator: ObjectId,
    base: ObjectId,
    state: {
        generalState: String,
        lastMaintenance: Date,
        notes: String
    },
    missions: [{type: ObjectId, default: null}]
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
    mainteiners: [{type: ObjectId, default: null}],
    logbooks: [{type: ObjectId, default: null}],
    qtb: [{type: ObjectId, default: null}]
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

/*
exports.Operator = mongoose.model('Operator', airOperatorSchema);

exports.newOperator = (mName, mCountry, mCity, mAddress) => {
    var Operator = mongoose.model('Operator', airOperatorSchema);
    var instance = new Operator({
        _id: new mongoose.Types.ObjectId(),
        name: mName,
        location: {
            country: mCountry,
            city: mCity,
            address: mAddress
        }
    });
    instance.save((err) => {
        if (err)
            return console.log(err);
    });
}
*/