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
 * - EventLog
**/

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.Schema.Types.ObjectId

exports.droneTypes = droneTypes = ['vl/l', 'cro']


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
        droneTypes: [{type: String, default: [], enum: droneTypes}],
        flightTime: {type: Number, default: 0}
    },
    missions: {
        supervisor: {
            requested: [{type: ObjectId, default: [], ref: 'mission'}],
            organized: [{type: ObjectId, default: [], ref: 'mission'}],
            started:   [{type: ObjectId, default: [], ref: 'mission'}],
            completed: [{type: ObjectId, default: [], ref: 'mission'}]
        },
        pilot: {
            completed:          [{type: ObjectId, default: [], ref: 'mission'}],
            waitingForLogbook:  [{type: ObjectId, default: [], ref: 'mission'}],
            running:            {type: ObjectId,  default: undefined, ref: 'mission'} // Indica la missione in cui è attualmente impegnato
        },
        crew: {
            completed:  [{type: ObjectId, default: [], ref: 'mission'}],
            running:    {type: ObjectId, default: undefined, ref: 'mission'} // Indica la missione in cui è attualmente impegnato
        },
        maintainer: {
            completed:  [{type: ObjectId, default: [], ref: 'mission'}],
            running:    {type: ObjectId, default: undefined, ref: 'mission'} // Indica la missione in cui è attualmente impegnato
        },
        accepted: [{
            idMission:  {type: ObjectId, default: undefined, ref: 'mission'},   // _id delle Missioni accettate
            date:       {type: Date, default: undefined},                       // Data delle missioni accettate --> usata per vedere se è impegnato in missione
            roles:      [{type: String, enum: ['pilot', 'crew', 'maintainer']}] // Ruoli che può ricoprire nella missione
        }]
    },
    locPermission: {type: Boolean, default: false} // Da rimuovere
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
    type: {type: String, enum: droneTypes}, // Taglia del drone
    airOperator: {type: ObjectId, ref: 'air_operator'}, 
    base: {type: ObjectId, ref: 'base'},
    batteryTypes: [{type: String, ref: 'battery'}],
    state: {
        availability: {type: Number, default: 0}, /* 0 -> Disponibile, 2 -> In manutenzione */ // Non ha senso tenere in missione, lo capisco dalla data delle missioni per cui è inserito
        /* generalState: String, /* Potrebbe non servire */
        maintenances: [{
            start: Date,
            end: Date
        }],
        flightTimeSinceLastMaintenance: Number, /* Aggiornato ogni qual volta viene inserito un QTB e azzerato ad ogni manutenzione, campo utilizzato per verificare lo stato di usura */
        notes: String                           /* Il campo sopra potrebbe essere azzerato nel momento in cui viene modificato il campo lastMaintenance */
    },
    missions: {
        completed: [{type: ObjectId, default: [], ref: 'mission'}],
        waitingForQtb: [{
            idMission: {type: ObjectId, default: undefined, ref: 'mission'},
            date: {type: Date, default: undefined} // La data serve a stabilire se il drone è in missione in quel giorno
        }], /* Missioni per cui non è ancora stato inserito un QTB */
    }
});

exports.batterySchema = new Schema({
    _id: ObjectId,
    code: {type: String, unique: true},
    type: {type: String, ref: 'drone'}
});

exports.missionsSchema = new Schema({
    _id:         ObjectId,
    date:       Date, // Giorno in cui viene effettuata la missione
    base:       {type: ObjectId, ref: 'base'},
    supervisor: {type: ObjectId, ref: 'personnel'},
    AM:         {type: ObjectId, ref: 'personnel'}, // AM che ha richiesto la missione
    location: {
        latitude:   Number,
        longitude:  Number
    },
    droneType: { type: String, enum: droneTypes },
    notifiedBases: [{
        _id:        { type: ObjectId, ref: 'base' },
        timestamp:  { type: Date, default: Date.now }
    }],
    /*
    notifiedNearestBase: {
        value:      {type: Boolean, default: false},
        timestamp:  {type: Date, default: undefined}
    },*/
    status: {
        requested: { // la missione è richietsa dall'AM ad un BaseSup
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: undefined}
            //timeout: Date // Tempo entro il quale il BaseSup deve rispondere, se non risponde va notificato l'AM
        },
        waitingForTeam: { // Il baseSup ha preso in carico la missione, l'AM è notificato e si attende che le persone diano disponibilità 
            value: {type: Boolean, default: false},
            createTeamButton: { // Messaggio al BaseSup che gli permette di creare un Team
                //chatId:     {type: Number, default: undefined},
                messageId:  {type: Number, default: undefined} // Identificatore del messaggio, usato per consentire aggiornamento del messaggio
            },
            timestamp: {type: Date, default: undefined}
        },
        teamCreated: { // Il team viene creato dal baseSup e l'AM viene notificato
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: undefined}
        },
        started: { // Il baseSup dichiara iniziata la missione
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: undefined}
        },
        waitingForDocuments: { // La missione è stata completata, il baseSup e l'AM vengono notificati. Si resta in attesa della documentazione di droni e piloti
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: undefined}
        },
        completed: { // La missione è completata e la documentazione è stata inserita
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: undefined}
        },
        aborted: { // Non è stato possibile creare la missione
            value: {type: Boolean, default: false},
            timestamp: {type: Date, default: undefined}
        }
    },
    personnel: {
        notified: [{type: ObjectId, ref: 'personnel', default: []}], // Elenco delle persone che sono state notificate
        accepted: [{ // Elenco delle persone che hanno accettato la missione
            _id: {type: ObjectId, ref: 'personnel'},
            roles:  [{type: String, enum: ['pilot', 'crew', 'maintainer']}], // Ruoli che può ricoprire nella missione
            timestamp: {type: Date, default: Date.now}
        }],
        declined: [{ // Elenco delle persone che hanno rifiutato la missione
            _id: {type: ObjectId, ref: 'personnel'},
            timestamp: {type: Date, default: Date.now}
        }]
    },
    description: {
        duration: { /* Durata della missione, può differire dai tempi di volo */
            expected:   Number,
            effective:  Number
        },
        //rank: {type: Number, min: 1, max: 5}, /* Difficoltà della missione (0 -> 5) */
        riskEvaluation: {
            scenario:   String,
            level:      Number
        },
        flightPlan: String, /* Presumibilemente sarà un riferimento ad un documento come il Logbook */
        notes: String
    },
    drones:[{
        _id:    {type: ObjectId, ref: 'drone'},
        type:   {type: String, enum: droneTypes}
    }],
    teams: [{
        pilots: {
            chief:  {type: ObjectId, ref: 'personnel', default: undefined},
            co:     {type: ObjectId, ref: 'personnel', default: undefined}
        },
        crew:           [{type: ObjectId, ref: 'personnel', default: []}],
        maintainers:    [{type: ObjectId, ref: 'personnel', default: []}],
        timestamp:      {type: Date, default: Date.now} // Timestamp della creazione del team
    }],
    logbooks:   [{type: ObjectId, default: [], ref: 'logbook'}],
    qtbs:       [{type: ObjectId, default: [], ref: 'qtb'}]
});

exports.logbooksSchema = new Schema({
    _id: ObjectId,
    //date: Date,
    documentRef: String,
    pilot: {type: ObjectId, ref: 'personnel'},
    mission: {type: ObjectId, ref: 'mission'},
})

exports.qtbSchema = new Schema({
    _id:    ObjectId,
    date:   Date,
    drone:   { type: ObjectId, ref: 'drone' },
    mission: { type: ObjectId, ref: 'mission' },
    flights: [{
        flightStart: String,
        flightEnd:   String,
        pilotId:     { type: ObjectId, ref: 'personnel' },
        notes:       String
    }]
})


exports.eventLogSchema = new Schema({
    type:   String, // Tipo di evento, es: missionRequested
    actor:  ObjectId, // Chi compie l'evento
    subject: { // Chi subisce l'evento
        type:   {type: String, enum: ['Mission', 'Personnel', 'Drone', 'Logbook', 'Qtb']},
        _id:    ObjectId
    }, 
    timestamp: {type: Date, default: Date.now}
})
