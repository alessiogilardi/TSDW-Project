
exports.AirOperators = [{
    _id: null,
    name: 'eurodrone',
    location: {
      country: 'Italy',
      city: 'Genoa',
      address: 'Via Balbi 22'
    },
    roles: {
      AM: undefined,
      CQM: undefined,
      SM: undefined
    },
    bases: []
}];

exports.Bases = [{
    _id: null,
    name: 'Base1',
    airOperator: 'eurodrone',
    location: {
        country: 'Italy',
        city: 'La Spezia',
        address: 'Via Fasulla 123',
        coordinates: {
            latitude: 2222,
            longitude: 2222
        }
    },
    roles: {
        viceAM: undefined,
        supervisor: undefined
    },
    staff: {
        pilots: [],
        crew: [],
        maintainers: []
    },
    drones: []
},

{
    _id: null,
    name: 'Base2',
    airOperator: 'eurodrone',
    location: {
        country: 'Italy',
        city: 'Imperia',
        address: 'Via Poggio 23',
        coordinates: {
            latitude: 3363,
            longitude: 456
        }
    },
    roles: {
        viceAM: undefined,
        supervisor: undefined
    },
    staff: {
        pilots: [],
        crew: [],
        maintainers: []
    },
    drones: []
}];

exports.Personnel = [{
    _id: null,
    idTelegram: 1234,
    name: 'Tizio',
    surname: 'uno',
    cf: '12345',
    location: {
        country: 'Italy',
        city: 'Imperia',
        address: 'FakeStreet'
    },
    airOperator: 'eurodrone',
    base: 'Base1',
    roles: {
        command: {
            airOperator: {
                AM: true
            },
            base: {
                supervisor: true
            },
        },
        occupation: {
            pilot: true,
            crew: true
        }
    },
    pilot: {
        license: {
            id: 'lic-id-01',
            type: 'type',
            maxMissionRank: 3,
            expiring: new Date()
        },
        droneTypes: ['AAA', 'bbb', 'CCC']
    },
    missions: {
        supervisor:  {
            completed: [],
            pending: []
        },
        pilot: {
            completed: [],
            waitingForLogbook: []
        },
        crew:  {
            completed: []
        },
        maintainers:  {
            completed: undefined
        },
    }
},
{
    _id: null,
    idTelegram: 350400256,
    name: 'Alessio',
    surname: 'Bollea',
    cf: '5698',
    location: {
        country: 'Italy',
        city: 'Genoa',
        address: '12353'
    },
    airOperator: 'eurodrone',
    base: 'Base2',
    roles: {
        command: {
            airOperator: {
                SM: true
            }
        },
        occupation: {
            pilot: true,
            maintainer: true
        }
    },
    pilot: {
        license: {
            id: 'lic-id-02',
            type: 'type',
            maxMissionRank: 4,
            expiring: new Date()
        },
        droneTypes: ['AAA', 'bbb', 'CCC']
    },
    missions: {
        supervisor:  {
            completed: [],
            pending: []
        },
        maintainers:  {
            completed: []
        },
    }
}];

exports.Drones = [{
    _id: null,
    number: 'aaa123', /* Non sapendo se sia numerico o alfanumerico */
    type: 'type',
    airOperator: 'eurodrone',
    base: 'Base2',
    batteryTypes: ['AA'],
    state: {
        generalState: 'OK', /* Potrebbe non servire */
        lastMaintenance: new Date(),
        flightTimeSinceLastMaintenance: 0, /* Aggiornato ogni qual volta viene inserito un QTB e azzerato ad ogni manutenzione, campo utilizzato per verificare lo stato di usura */
        notes: null                           /* Il campo sopra potrebbe essere azzerato nel momento in cui viene modificato il campo lastMaintenance */
    }
}];

exports.Missions = [{
    id: null,
    date: new Date(),
    type: 'String', /* Potrebbe essere cancellato in quanto esiste il campo rank più preciso */
    base: 'Base1',
    supervisor: '12345', /* Il CF */
    description: {
        duration: { /* Durata della missione, può differire dai tempi di volo */
            expected: 5
        },
        rank: 3, /* Difficoltà della missione (0 -> 5) */
        flightPlan: 'FligthPlan' /* Presumibilemente sarà un riferimento ad un documento come il Logbook */
    },
    drones: [1234, 56789]
}];