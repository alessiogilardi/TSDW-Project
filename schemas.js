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
    AM: {type: ObjectId, default: null, ref: 'personnel'},
    CQM: {type: ObjectId, default: null, ref: 'personnel'},
    SM: {type: ObjectId, default: null, ref: 'personnel'}
  },
  bases: [{type: ObjectId, default: [], ref: 'base'}]
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
    airOperator: {type: ObjectId, ref: 'air_operator'},
    base: {type: ObjectId, ref: 'base'},
    roles: [String],
    missions: [{type: ObjectId, default: [], ref: 'mission'}],
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
    airOperator: {type: ObjectId, ref: 'air_operator'},
    location: {
        country: String,
        city: String,
        address: String,
        latitude: Number,
        longitude: Number
    },
    roles: {
        ViceAM: {type: ObjectId, default: null, ref: 'personnel'},
        BaseSupervisor: {type: ObjectId, default: null, ref: 'personnel'}
    },
    staff: {
        pilots: [{type: ObjectId, default: [], ref: 'personnel'}],
        equip: [{type: ObjectId, default: [], ref: 'personnel'}],
        mainteiners: [{type: ObjectId, default: [], ref: 'personnel'}]
    },
    drones: [{type: ObjectId, default: [], ref: 'drone'}]
});

exports.dronesSchema = new mongoose.Schema({
    _id: ObjectId,
    number: {type: String, unique: true}, /* Non sapendo se sia numerico o alfanumerico */
    type: String,
    airOperator: {type: ObjectId, ref: 'air_operator'},
    base: {type: ObjectId, ref: 'base'},
    state: {
        generalState: String,
        lastMaintenance: Date,
        notes: String
    },
    missions: [{type: ObjectId, default: [], ref: 'mission'}]
});

exports.missionsSchema = new mongoose.Schema({
    id: ObjectId,
    date: Date,
    location: {
        latitude: Number,
        longitude: Number
    },
    type: String,
    base: {type: ObjectId, ref: 'base'},
    supervisor: {type: ObjectId, ref: 'personnel'},
    duration: {
        expectedDuration: Number,
        effectiveDuration: Number
    },
    description: String,
    flightPlan: String,
    drones: [{type: ObjectId, ref: 'drone'},],
    pilots: [{type: ObjectId, ref: 'personnel'},],
    equip: [{type: ObjectId, ref: 'personnel'},],
    mainteiners: [{type: ObjectId, default: [], ref: 'personnel'}],
    logbooks: [{type: ObjectId, default: [], ref: 'logbook'}],
    qtb: [{type: ObjectId, default: [], ref: 'qtb'}]
});

/*
    Il tempo di volo ptrebbe essere composto da voli separati?
    Nel caso io lo strutturerei in questo modo:
    info: {
        fligths: [{
            flightStart: Date,
            flightEnd: Date,
            notes: String
        }],
        totalFlightTime: Number  // Non so se serva mantenerlo o sia meglio desumerlo dai campi sopra
    }
*/
exports.logbooksSchema = new mongoose.Schema({
    _id: ObjectId,
    pilotWriter: {type: ObjectId, ref: 'personnel'},
    mission: {type: ObjectId, ref: 'mission'},
    info: {
        flightTime: Number,
        notes: String
    }
});

/*
    Stesso discorso, come sopra, anzi forse qui è più importante 
    dato che sono dati sicuramente più precisi presi dal drone stesso
    info: {
        fligths: [{
            flightStart: Date,
            flightEnd: Date,
            notes: String
        }],
        totalFlightTime: Number  // Non so se serva mantenerlo o sia meglio desumerlo dai campi sopra
    }
*/
exports.qtbSchema = new mongoose.Schema({
    _id: ObjectId,
    drone:  {type: ObjectId, ref: 'drone'},
    mission:  {type: ObjectId, ref: 'mission'},
    info: {
        fligthTime: Number,
        notes: String
    }
});