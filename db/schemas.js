/**
 * Modulo che conserva i vari Schema della struttura del DB
**/

// TODO: aggiungere ai dati della missione anche il tipo di drone aggiunto
// in modo da sempleificare le query di ricerca quando si inserisce una nuova missione

const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

exports.droneTypes = droneTypes = ['S', 'M', 'L', 'XL'] // TODO: Da cambiare con i valori veri

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
    telegramData: {
        idTelegram: {type: Number, unique: true},
        botStarted: {type: Boolean, default: false}
    },
    name: String,
    surname: String,
    cf: {type: String, unique: true, minlength: 16, maxlength: 16},
    location: {
        country: String,
        city: String,
        address: String
    },
    airOperator: {type: ObjectId, ref: 'air_operator'},
    base: {type: ObjectId, ref: 'base'},
    roles: {
        command: {
            airOperator: {
                AM: {type: Boolean, defaulf: false},
                SM: {type: Boolean, default: false},
                CQM: {type: Boolean, default: false}
            },
            base: {
                viceAM: {type: Boolean, default: false},
                supervisor: {type: Boolean, default: false}
            },
        },
        occupation: {
            pilot: {type: Boolean, default: false},
            crew: {type: Boolean, default: false},
            maintainer: {type: Boolean, default: false}
        }
    },
    pilot: {
        license: {
            id: {type: String, default: null},
            type: {type: String, default: null},
            maxMissionRank: {type: Number, default: null, min: 1, max: 5},
            expiring: {type: Date, default: null}
        },
        droneTypes: [{type: String, default: [], enum: droneTypes}]
    },
    missions: {
        available: {type: Boolean, default: true}, // Indica se un membro del personale è attualmente occupato in missione
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
            pending: {type: ObjectId, default: undefined, ref: 'mission'} // Indica la missione in cui è attualmente impegnato
        },
        maintainers:  {
            completed: [{type: ObjectId, default: [], ref: 'mission'}],
            pending: {type: ObjectId, default: undefined, ref: 'mission'} // Indica la missione in cui è attualmente impegnato
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
        viceAM: {type: ObjectId, default: null, ref: 'personnel'},
        supervisor: {type: ObjectId, default: null, ref: 'personnel'}
    },
    staff: {
        pilots: [{type: ObjectId, default: [], ref: 'personnel'}],
        crew: [{type: ObjectId, default: [], ref: 'personnel'}],
        maintainers: [{type: ObjectId, default: [], ref: 'personnel'}]
    },
    drones: [{type: ObjectId, default: [], ref: 'drone'}]
});

exports.dronesSchema = new mongoose.Schema({
    _id: ObjectId,
    number: {type: String, unique: true}, /* Non sapendo se sia numerico o alfanumerico */
    type: {type: String, enum: droneTypes},
    airOperator: {type: ObjectId, ref: 'air_operator'},
    base: {type: ObjectId, ref: 'base'},
    batteryTypes: [{type: String, ref: 'battery'}],
    state: {
        availability: {type: Number, default: 0}, /* 0 -> Disponibile, 1 -> In Missione, 2 -> In manutenzione */
        /* generalState: String, /* Potrebbe non servire */
        lastMaintenance: Date,
        flightTimeSinceLastMaintenance: Number, /* Aggiornato ogni qual volta viene inserito un QTB e azzerato ad ogni manutenzione, campo utilizzato per verificare lo stato di usura */
        notes: String                           /* Il campo sopra potrebbe essere azzerato nel momento in cui viene modificato il campo lastMaintenance */
    },
    missions: {
        completed: [{type: ObjectId, default: [], ref: 'mission'}],
        waitingForQtb: [{type: ObjectId, default: [], ref: 'mission'}] /* Missioni per cui non è ancora stato inserito un QTB */
    }
});

exports.batterySchema = new mongoose.Schema({
    _id: ObjectId,
    code: {type: String, unique: true},
    type: {type: String, ref: 'drone'}
});

exports.missionsSchema = new mongoose.Schema({
    id: ObjectId,
    date: Date,
    base: {type: ObjectId, ref: 'base'},
    supervisor: {type: ObjectId, ref: 'personnel'},
    status: {type: Number, default: 0, min: 0, max: 4}, /* 0 -> Instantiated, 1 -> Pending, 2 -> Running, 3 -> Completed, 4 -> Completed and documented */
    pilots: {
        notified: [{type: ObjectId, ref: 'personnel', default: []}],
        accepted: [{type: ObjectId, ref: 'personnel', default: []}], /* Nome del campo da rivedere */
        chosen: [{type: ObjectId, ref: 'personnel', default: []}] /* Nome del campo da rivedere */
    },
    crew: {
        notified: [{type: ObjectId, ref: 'personnel', default: []}],
        accepted: [{type: ObjectId, ref: 'personnel', default: []}], /* Nome del campo da rivedere */
        chosen: [{type: ObjectId, ref: 'personnel', default: []}] /* Nome del campo da rivedere */
    },
    maintainers: {
        notified: [{type: ObjectId, ref: 'personnel', default: []}],
        accepted: [{type: ObjectId, ref: 'personnel', default: []}], /* Nome del campo da rivedere */
        chosen: [{type: ObjectId, ref: 'personnel', default: []}] /* Nome del campo da rivedere */
    },
    description: {
        duration: { /* Durata della missione, può differire dai tempi di volo */
            expected: Number,
            effective: Number
        },
        rank: {type: Number, min: 1, max: 5}, /* Difficoltà della missione (0 -> 5) */
        flightPlan: String, /* Presumibilemente sarà un riferimento ad un documento come il Logbook */
        notes: String
    },
    drones:[{
        _id: {type: ObjectId, ref: 'drone'},
        type: {type: String, enum: droneTypes} // deve essere un tipo valido
    }],
    teams: [{
        pilots: {
            chief: {type: ObjectId, ref: 'personnel', default: []},
            co: {type: ObjectId, ref: 'personnel', default: []}
        },
        crew: [{type: ObjectId, ref: 'personnel', default: []}],
        maintainers: [{type: ObjectId, ref: 'personnel', default: []}]
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
