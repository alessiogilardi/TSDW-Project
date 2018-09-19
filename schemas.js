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
    roles: {
        command: {
            airOperator: {type: String, default: []}, // AM, CQM, SM
            base: [{type: String, default: []}] // ViceAM, Supervisor
        },
        occupation: [String] // pilot, crew, maintainer
    },
    pilot: {
        license: {
            id: {type: String, default: null},
            type: {type: String, default: null},
            maxMissionRank: {type: String, default: null},
            expiring: {type: Date, default: null}
        },
        droneTypes: [{type: String, default: null}]
    },
    missions: {
        supervisor:  {
            completed: [{type: ObjectId, default: [], ref: 'mission'}],
            pending: [{type: ObjectId, default: [], ref: 'mission'}]
        },
        pilot: {
            completed: [{type: ObjectId, default: [], ref: 'mission'}],
            waitingForLogbook: [{type: ObjectId, default: [], ref: 'mission'}]
        },
        crew:  {
            completed: [{type: ObjectId, default: [], ref: 'mission'}],
        },
        maintainers:  {
            completed: [{type: ObjectId, default: [], ref: 'mission'}],
        },
    },
    locPermission: {type: Boolean, default: false}
});

exports.basesSchema = new mongoose.Schema({
    _id: ObjectId,
    name: {type: String, unique: true},
    airOperator: {type: ObjectId, ref: 'air_operator'},
    location: {
        country: String,
        city: String,
        address: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    roles: {
        ViceAM: {type: ObjectId, default: null, ref: 'personnel'},
        BaseSupervisor: {type: ObjectId, default: null, ref: 'personnel'}
    },
    staff: {
        pilots: [{type: ObjectId, default: [], ref: 'personnel'}],
        crew: [{type: ObjectId, default: [], ref: 'personnel'}],
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
        availability: Number, /* 0 -> Disponibile, 1 -> In Uso, 2 -> In manutenzione */
        generalState: String, /* Potrebbe non servire */
        lastMaintenance: Date,
        flightTimeSinceLastMaintenance: Number, /* Aggiornato ogni qual volta viene inserito un QTB, campo utilizzato per verificare lo stato di usura */
        notes: String
    },
    missions: {
        completed: [{type: ObjectId, default: [], ref: 'mission'}],
        waitingForQtb: [{type: ObjectId, default: [], ref: 'mission'}] /* Missioni per cui non è ancora stato inserito un QTB */
    }
});

exports.missionsSchema = new mongoose.Schema({
    id: ObjectId,
    date: Date,
    type: String,
    base: {type: ObjectId, ref: 'base'},
    supervisor: {type: ObjectId, ref: 'personnel'},
    status: Number, /* 0 -> Instantiated, 1 -> Pending, 2 -> Running, 3 -> Completed */
    pilots: {
        notified: [{type: ObjectId, ref: 'personnel'}],
        accepted: [{type: ObjectId, ref: 'personnel'}], /* Nome del campo da rivedere */
        chosen: [{type: ObjectId, ref: 'personnel'}] /* Nome del campo da rivedere */
    },
    crew: {
        notified: [{type: ObjectId, ref: 'personnel'}],
        accepted: [{type: ObjectId, ref: 'personnel'}], /* Nome del campo da rivedere */
        chosen: [{type: ObjectId, ref: 'personnel'}] /* Nome del campo da rivedere */
    },
    mainteiners: {
        notified: [{type: ObjectId, ref: 'personnel'}],
        accepted: [{type: ObjectId, ref: 'personnel'}], /* Nome del campo da rivedere */
        chosen: [{type: ObjectId, ref: 'personnel'}] /* Nome del campo da rivedere */
    },
    description: {
        duration: { /* Durata della missione, può differire dai tempi di volo */
            expectedDuration: Number,
            effectiveDuration: Number
        },
        rank: Number, /* Difficoltà della missione (0 -> 5) */
        flightPlan: String,
        notes: String
    },
    drones: [{type: ObjectId, ref: 'drone'}],
    teams: [{
        pilots: {
            chief: {type: ObjectId, ref: 'personnel'},
            co: {type: ObjectId, ref: 'personnel'}
        },
        crew: [{type: ObjectId, ref: 'personnel'}],
        maintainers: [{type: ObjectId, ref: 'personnel'}]
    }],
    logbooks: [{type: ObjectId, default: [], ref: 'logbook'}],
    qtb: [{type: ObjectId, default: [], ref: 'qtb'}]
});

exports.logbooksSchema = new mongoose.Schema({
    _id: ObjectId,
    date: Date,
    documentRef: String,
    pilot: {type: ObjectId, ref: 'personnel'},
    mission: {type: ObjectId, ref: 'mission'},
});

exports.qtbSchema = new mongoose.Schema({
    _id: ObjectId,
    date: Date,
    drone:  {type: ObjectId, ref: 'drone'},
    mission:  {type: ObjectId, ref: 'mission'},
    flights: [{
        flightStart: Date,
        flightEnd: Date,
        batteryCode: String,
        notes: String
    }]
});