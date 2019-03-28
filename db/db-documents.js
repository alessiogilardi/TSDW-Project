/**
 * Dati utilizzati per inizializzare il db
 */

const schemas = require('./schemas')
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
    telegramData: {
        idTelegram: 12345678910
    },
    name: 'Tizio',
    surname: 'uno',
    cf: 'UNOTZI91S13E465A',
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
                AM: false
            },
            base: {
                supervisor: false
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
        droneTypes: schemas.droneTypes
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
    telegramData: {
        idTelegram: 0 //283625324
    },
    name: 'Gianni',
    surname: 'Vercelli',
    cf: 'AAAASS91S13E463A',
    location: {
        country: 'Italy',
        city: 'Genoa',
        address: '12353'
    },
    airOperator: 'eurodrone',
    base: 'Base1',
    roles: {
        command: {
            airOperator: {
                AM: false,
                SM: false
            },
            base: {
                supervisor: false
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
            type: 'vl/l',
            maxMissionRank: 4,
            expiring: new Date()
        },
        droneTypes: schemas.droneTypes
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
},



{
    _id: null,
    telegramData: {
        idTelegram: 350400256
    },
    name: 'Alessio',
    surname: 'Bollea',
    cf: 'BLLLSS91S13E463E',
    location: {
        country: 'Italy',
        city: 'Genoa',
        address: '12353'
    },
    airOperator: 'eurodrone',
    base: 'Base1',
    roles: {
        command: {
            airOperator: {
                AM: false,
                SM: false
            },
            base: {
                supervisor: false
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
            type: 'vl/l',
            maxMissionRank: 4,
            expiring: new Date()
        },
        droneTypes: schemas.droneTypes
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
},

{
    _id: null,
    telegramData: {
        idTelegram: 69921034
    },
    name: 'Luca',
    surname: 'Defilippi',
    cf: 'DFLLUC93S13E463N',
    location: {
        country: 'Italy',
        city: 'Genoa',
        address: '12353'
    },
    airOperator: 'eurodrone',
    base: 'Base1',
    roles: {
        occupation: {
            pilot: true,
            crew: true,
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
        droneTypes: schemas.droneTypes
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
},

{
    _id: null,
    telegramData: {
        idTelegram: 33017299
    },
    name: 'Alessio',
    surname: 'Gilardi',
    cf: 'GLRLSS91S13E463N',
    location: {
        country: 'Italy',
        city: 'Genoa',
        address: '12353'
    },
    airOperator: 'eurodrone',
    base: 'Base1',
    roles: {
        command: {
            airOperator: {
                SM: true,
                AM: true
            },
            base: {
                supervisor: true
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
            type: 'vl/l',
            maxMissionRank: 4,
            expiring: new Date()
        },
        droneTypes: schemas.droneTypes
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
    type: schemas.droneTypes[0],
    airOperator: 'eurodrone',
    base: 'Base2',
    batteryTypes: ['AA'],
    state: {
        lastMaintenance: new Date(),
        flightTimeSinceLastMaintenance: 0, /* Aggiornato ogni qual volta viene inserito un QTB e azzerato ad ogni manutenzione, campo utilizzato per verificare lo stato di usura */
        notes: null                           /* Il campo sopra potrebbe essere azzerato nel momento in cui viene modificato il campo lastMaintenance */
    }
},
{
    _id: null,
    number: 'bbb111',
    type: schemas.droneTypes[0],
    airOperator: 'eurodrone',
    base: 'Base2',
    batteryTypes: ['AA'],
    state: {
        lastMaintenance: new Date(),
        flightTimeSinceLastMaintenance: 0, /* Aggiornato ogni qual volta viene inserito un QTB e azzerato ad ogni manutenzione, campo utilizzato per verificare lo stato di usura */
        notes: null                           /* Il campo sopra potrebbe essere azzerato nel momento in cui viene modificato il campo lastMaintenance */
    }
},
{
    _id: null,
    number: 'abc123',
    type: schemas.droneTypes[0],
    airOperator: 'eurodrone',
    base: 'Base1',
    batteryTypes: ['AA'],
    state: {
        lastMaintenance: new Date(),
        flightTimeSinceLastMaintenance: 0, /* Aggiornato ogni qual volta viene inserito un QTB e azzerato ad ogni manutenzione, campo utilizzato per verificare lo stato di usura */
        notes: null   
    }    
},
{
    _id: null,
    number: 'abc456',
    type: schemas.droneTypes[0],
    airOperator: 'eurodrone',
    base: 'Base1',
    batteryTypes: ['AA'],
    state: {
        lastMaintenance: new Date(),
        flightTimeSinceLastMaintenance: 0, /* Aggiornato ogni qual volta viene inserito un QTB e azzerato ad ogni manutenzione, campo utilizzato per verificare lo stato di usura */
        notes: null   
    }    
}];

exports.Missions = [{
    id: null,
    date: new Date(),
    base: 'Base1', /* Id della base non il nome */
    supervisor: '12345', /* Deve essere un id */
    description: {
        duration: { /* Durata della missione, può differire dai tempi di volo */
            expected: 5
        },
        rank: 3, /* Difficoltà della missione (0 -> 5) */
        flightPlan: 'FligthPlan' /* Presumibilemente sarà un riferimento ad un documento come il Logbook */
    },
    drones: [1234, 56789]
}];