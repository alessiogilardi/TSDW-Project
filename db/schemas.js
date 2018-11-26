/**
 * Modulo che conserva i vari Schema della struttura del DB.
 * - AirOperator
 * - Personnel
 * - Base
 * - Drone
 * - Battery
 * - Mission
 * - Logbook
 * - QTB
**/

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.Schema.Types.ObjectId

const eventTypes = ['comandoBot', 'notifica']
exports.scenarios = scenarios = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'C']
exports.riskLevel = riskLevel = {min: 1, max: 4}
const riskEvaluation = { // TODO: inserire una valutazione di rischio
    
}
exports.droneTypes = droneTypes = ['VL', 'L', 'CRO']


exports.airOperatorSchema = new Schema({
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

exports.personnelSchema = new Schema({
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
                AM: {type: Boolean, default: false},
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
            //maxMissionRank: {type: Number, default: null, min: 1, max: 5},
            expiring: {type: Date, default: null}
        },
        droneTypes: [{type: String, default: [], enum: droneTypes}]
    },
    missions: {
        supervisor: {
            completed: [{type: ObjectId, default: [], ref: 'mission'}],
            pending: [{type: ObjectId, default: [], ref: 'mission'}]
        },
        pilot: {
            completed: [{type: ObjectId, default: [], ref: 'mission'}],
            waitingForLogbook: [{type: ObjectId, default: [], ref: 'mission'}],
            accepted: [{
                idMission: {type: ObjectId, default: undefined, ref: 'mission'},
                date: {type: Date, default: undefined} // Data della missione, usata per vedere se un pilota è occupato in missione
            }]
        },
        crew:  {
            completed: [{type: ObjectId, default: [], ref: 'mission'}],
            accepted: [{
                idMission: {type: ObjectId, default: undefined, ref: 'mission'},
                date: {type: Date, default: undefined} // Data della missione, usata per vedere se un crew è occupato in missione
            }],
            pending: {type: ObjectId, default: undefined, ref: 'mission'} // Indica la missione in cui è attualmente impegnato
        },
        // TODO: cambiare da maintaines a manitainer
        // cerca Personnel -> 'missions.maintainers'
        maintainers:  {
            completed: [{type: ObjectId, default: [], ref: 'mission'}],
            accepted: [{
                idMission: {type: ObjectId, default: undefined, ref: 'mission'},
                date: {type: Date, default: undefined} // Data della missione, usata per vedere se un manutentore è occupato in missione
            }],
            pending: {type: ObjectId, default: undefined, ref: 'mission'} // Indica la missione in cui è attualmente impegnato
        },
    },
    locPermission: {type: Boolean, default: false}
});

exports.basesSchema = new Schema({
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

exports.dronesSchema = new Schema({
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
        waitingForQtb: [{
            idMission: {type: ObjectId, default: undefined, ref: 'mission'},
            date: {type: Date, default: undefined}
        }], /* Missioni per cui non è ancora stato inserito un QTB */
    }
});

exports.batterySchema = new Schema({
    _id: ObjectId,
    code: {type: String, unique: true},
    type: {type: String, ref: 'drone'}
});

exports.missionsSchema = new Schema({
    id: ObjectId,
    date: Date, // Giorno in cui viene effettuata la missione
    base: {type: ObjectId, ref: 'base'},
    supervisor: {type: ObjectId, ref: 'personnel'},
    AM: {type: ObjectId, ref: 'personnel'}, // Campo usato per semplificare il sistema di notifica
    location: {
        latitude: Number,
        longitude: Number
    },
    status: {
        requested: { // la missione è richietsa dall'AM ad un BAseSup
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: Date.now},
            timeout: Date // Tempo entro il quale il BaseSup deve rispondere, se non risponde va notificato l'AM
        },
        waitingForTeam: { // Il baseSup ha preso in carico la missione, l'AM è notificato e si attende che le persone diano disponibilità 
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: Date.now},
        },
        teamCreated: { // Il team viene creato dal baseSup e l'AM viene notificato
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: Date.now}
        },
        started: { // Il baseSup dichiara iniziata la missione
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: Date.now}
        },
        waitingForDocuments: { // La missione è stata completata, il baseSup e l'AM vengono notificati. Si resta in attesa della documentazione di droni e piloti
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: Date.now}
        },
        completed: { // La missione è completata e la documentazione è stata inserita
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: Date.now}
        }
    },
    pilots: {
        notified: [{type: ObjectId, ref: 'personnel', default: []}],
        accepted: [{type: ObjectId, ref: 'personnel', default: []}], /* Nome del campo da rivedere */
        chosen: [{type: ObjectId, ref: 'personnel', default: []}], /* Nome del campo da rivedere */
        declined: [{type: ObjectId, ref: 'personnel', default: []}]
    },
    crew: {
        notified: [{type: ObjectId, ref: 'personnel', default: []}],
        accepted: [{type: ObjectId, ref: 'personnel', default: []}], /* Nome del campo da rivedere */
        chosen: [{type: ObjectId, ref: 'personnel', default: []}], /* Nome del campo da rivedere */
        declined: [{type: ObjectId, ref: 'personnel', default: []}]
    },
    maintainers: {
        notified: [{type: ObjectId, ref: 'personnel', default: []}],
        accepted: [{type: ObjectId, ref: 'personnel', default: []}], /* Nome del campo da rivedere */
        chosen: [{type: ObjectId, ref: 'personnel', default: []}], /* Nome del campo da rivedere */
        declined: [{type: ObjectId, ref: 'personnel', default: []}]
    },
    description: {
        duration: { /* Durata della missione, può differire dai tempi di volo */
            expected: Number,
            effective: Number
        },
        //rank: {type: Number, min: 1, max: 5}, /* Difficoltà della missione (0 -> 5) */
        riskEvaluation: {
            scenario: String,
            level: Number
        },
        flightPlan: String, /* Presumibilemente sarà un riferimento ad un documento come il Logbook */
        notes: String
    },
    drones:[{
        _id: {type: ObjectId, ref: 'drone'},
        type: {type: String, enum: droneTypes}
    }],
    teams: [{
        pilots: {
            chief: {type: ObjectId, ref: 'personnel', default: undefined},
            co: {type: ObjectId, ref: 'personnel', default: undefined}
        },
        crew: [{type: ObjectId, ref: 'personnel', default: []}],
        maintainers: [{type: ObjectId, ref: 'personnel', default: []}],
        timestamp: {type: Date, default: Date.now} // Timestamp della creazione del team
    }],
    logbooks: [{type: ObjectId, default: [], ref: 'logbook'}],
    qtb: [{type: ObjectId, default: [], ref: 'qtb'}]
});

exports.logbooksSchema = new Schema({
    _id: ObjectId,
    date: Date,
    documentRef: String,
    pilot: {type: ObjectId, ref: 'personnel'},
    mission: {type: ObjectId, ref: 'mission'},
})

exports.qtbSchema = new Schema({
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
})

exports.eventLogSchema = new Schema({
    type: {type: String, enum: eventTypes},
    personnel: ObjectId, // Persona che scatena l'evento
    timestamp: {type: Date, default: Date.now}, 
    object: { // Oggetto su cui avviene l'evento
        type: String, // Collection dell'Oggetto su cui avviene l'evento (Missions, Drones, Logbooks, Qtbs)
        _id: ObjectId // ObjectId dell'Oggetto su cui aviene l'evento
    }
})
