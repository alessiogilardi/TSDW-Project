/**
 * Modulo di interazione con il db.
 * Qui vengono tenute le funzioni che eseguono query al db.
 * Le funzioni che devono restituire un risultato invocano una funzione di callback
 * alla quale sono passati i dati recuperati dal db.
 */

const mongoose      = require('mongoose');
const models        = require('./models');
const deasync       = require('deasync');
var eventEmitters   = require('../events/event-emitters');

// TODO: quando creo la missione devo anche settare i droni scelti come non disponibili
// e aggiungere la missione alle loro waitingForQtb missions

// TODO: quando completo la missione devo rilasciare personale e droni e renderli nuovamante disponibili

/**
 * Funzioni relative all'Operatore Aereo
 */
exports.AirOperator = AirOperator = {
    /**
     * Funzione che inserisce un Operatore Aereo.
     * 
     * @param {AirOperator} aAirOperator
     */
    insert: aAirOperator => {
        aAirOperator._id = mongoose.Types.ObjectId();
        new models.AirOperator(aAirOperator)
        .save((err, airOperator) => {
            if (err)
                return console.log(err);
            console.log('Inserted new AirOperator with id: ' + airOperator._id);

            // Emetto l'evento insert
            eventEmitters.Db.AirOperator.emit('insert', airOperator)
        });

    },

    /**
     * Funzione che esegue l'update dell'Operatore Aereo.
     * @param {} selection parametro usato per la selezione del documento di cui eseguire l'update
     * @param {} newValues parametro con i nuovi valori da inserire
     */
    update: (selection, newValues) => {
        models.AirOperator.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            // Emetto l'evento update
            eventEmitters.Db.AirOperator.emit('update')
            console.log(`Updated AirOperator selected by: ${JSON.stringify(selection)}`);
        })
    },

    /**
     * Funzione che esegue l'operazione di update selezionando l'Operatore Aereo per nome.
     */
    updateByName: (aName, newValues) => AirOperator.update({name: aName}, newValues),

    /**
     * Funzione che esegue l'operazione di update selezionando l'Operatore Aereo per id.
     */
    updateById: (aId, newValues) => AirOperator.update({_id: aId}, newValues),

    /**
     * Funzione che cerca un Operatore Aereo in base al nome.
     * @param {String} aName nome dell'Operatore da cercare
     * @param {String} projection attributi da cercare
     * @param {Function} callback funzione di callback a cui è passato l'Operatore trovato
     */
    findByName: (aName, projection, callback) => {
        models.AirOperator.findOne()
        .where('name').equals(aName)
        .select(projection)
        .exec((err, doc) => {
            if (err)
                return console.log(err);
            callback(doc);
        });
    },

    findByNameSync: (aName, projection) => {
        var ret = null;
        models.AirOperator.findOne()
        .where('name').equals(aName)
        .select(projection)
        .exec((err, res) => {
            ret = res;
        });
        while (ret == null)
            deasync.runLoopOnce();
        return ret;
    }

};

/**
 * Funzioni relative alla base
 */
exports.Base = Base = {
    /**
     * Funzione che inserisce un Base.
     * L'Operatore Aereo a cui la base appartiene è recuperato da una query in base al nome 
     * dell'Operatore.
     * Quando la query viene eseguita aggiungo la Base alla lista delle basi dell'Operatore Aereo.
     * 
     * @param {Base} aBase
     */
    insert: aBase => {
        AirOperator.findByName(aBase.airOperator, '_id', aAirOperator => {
            aBase._id = mongoose.Types.ObjectId();
            aBase.airOperator = aAirOperator._id
            new models.Base(aBase)
            .save((err, base) => {
                if (err)
                    return console.log(err);
                console.log('Inserted new base with _id: ' + base._id);
                // Emetto l'evento insert
                eventEmitters.Db.Base.emit('insert', base)
                // Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
                AirOperator.updateById(base.airOperator, {$push: {'bases': base._id}});
            });
        });
    },

    /**
     * Funzione che esegue l'update dela Base.
     * @param {} selection parametro usato per la selezione del documento di cui eseguire l'update
     * @param {} newValues parametro con i nuovi valori da inserire
     */
    update: (selection, newValues) => {
        models.Base.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            eventEmitters.Db.Base.emit('update')
            console.log(`Updated Base selected by: ${JSON.stringify(selection)}`)
        })
    },

    /**
     * Funzione che esegue l'operazione di update selezionando la Base per nome.
     */
    updateByName: (aName, newValues) => Base.update({name: aName}, newValues),
    /**
     * Funzione che esegue l'operazione di update selezionando la Base per id.
     */
    updateById: (aId, newValues) => Base.update({_id: aId}, newValues),

    /**
     * Funzione che cerca una Base in base al nome.
     * @param {String} aName nome della Base da cercare
     * @param {String} projection attributi da cercare
     * @param {Function} callback funzione di callback a cui è passata la Base trovato
     */
    findByName: (name, projection, callback) => {
        models.Base.findOne()
        .where('name').equals(name)
        .select(projection)
        .exec((err, doc) => {
            callback(doc);
        });
    },

    findByNameSync: (name, projection) =>  {
        var ret = null;
        models.Base.findOne()
        .where('name').equals(name)
        .select(projection)
        .exec((err, doc) => {
            ret = doc;
        });
        while (ret == null)
            deasync.runLoopOnce();
        return ret;
    }
};

/**
 * Funzioni relative al personale.
 */
exports.Personnel = Personnel = {
    /**
     * Funzione che inserisce un membro del Personale.
     * L'operatore Aereo e la Base a cui la Persona appartiene vengono recuperati da una query
     * in base al nome dell'Operatore e della Base.
     * Quando la query viene eseguita aggiorno la Base e l'Operatore Aereo in base ai ruili che quella
     * la Persona ricopre.
     * 
     * @param {Personnel} aPersonnel
     */
    insert: aPersonnel => {
        AirOperator.findByName(aPersonnel.airOperator, '_id', aAirOperator => {
            Base.findByName(aPersonnel.base, '_id', aBase => {
                aPersonnel._id          = mongoose.Types.ObjectId();
                aPersonnel.airOperator  = aAirOperator._id;
                aPersonnel.base         = aBase._id;

                new models.Personnel(aPersonnel)
                .save((err, personnel) => {
                    if (err)
                        return console.log(err);
                    console.log('Inserted new Personnel with id: ' + personnel._id);
                    // Emetto evento insert
                    eventEmitters.Db.Personnel.emit('insert', personnel)

                    // Inserisco i vincoli di integrità

                    // Aggiorno le occupazioni in base
                    if (personnel.roles.occupation.pilot)
                        Base.updateById(personnel.base, {$push: {'staff.pilots': personnel._id}});
                    if (personnel.roles.occupation.crew)
                        Base.updateById(personnel.base, {$push: {'staff.crew': personnel._id}});
                    if (personnel.roles.occupation.maintainer)
                        Base.updateById(personnel.base, {$push: {'staff.maintainers': personnel._id}});

                    // Aggiorno i ruoli di comando
                    if (personnel.roles.command.airOperator.AM)
                        AirOperator.updateById(personnel.airOperator, {'roles.AM': personnel._id});
                    if (personnel.roles.command.airOperator.CQM)
                        AirOperator.updateById(personnel.airOperator, {'roles.CQM': personnel._id});
                    if (personnel.roles.command.airOperator.SM)
                        AirOperator.updateById(personnel.airOperator, {'roles.SM': personnel._id});

                    if (personnel.roles.command.base.viceAM)
                        Base.updateById(personnel.base, {'roles.viceAM': personnel._id});
                    if (personnel.roles.command.base.supervisor)
                        Base.updateById(personnel.base, {'roles.supervisor': personnel._id});
                });
            });
        });
    },

    /**
     * Funzione che esegue l'update del membro del Personale.
     * @param {} selection parametro usato per la selezione del documento su cui eseguire l'update
     * @param {} newValues parametro con i nuovi valori da inserire
     */
    update: (selection, newValues) => {
        return models.Personnel.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            // Emetto evento update
            eventEmitters.Db.Personnel.emit('update')
            console.log(`Updated Personnel selected by: ${JSON.stringify(selection)}`)
        }).exec()
    },

    /**
     * Funzione che esegue l'operazione di update selezionando la Persona per CF.
     */
    updateByCf: (aCf, newValues) => {return Personnel.update({cf: aCf}, newValues) },
    /**
     * Funzione che esegue l'operazione di update selezionando la Persona per id.
     */
    updateById: (aId, newValues) => { return Personnel.update({_id: aId}, newValues) },
    /**
     * Funzione che esegue l'operazione di update selezionando la Persona per idTelegram.
     */
    updateByIdTelegram: (aIdTelegram, newValues) => {return Personnel.update({'telegramData.idTelegram': aIdTelegram}, newValues) },

    /**
     * Funzione che esegue la ricerca di membri del Personale e restituise i risultati
     * passandoli alla funzione di callback.
     * @param {String} selection parametro per selezionare i ducumenti da recuperare
     * @param {String} selection parametro per selezionare gli attributi da cercare
     * @param {Function} callback funzione di callback a cui passare i risultati della ricerca
     */
    find: (selection, projection, callback) => {
        models.Personnel.find(selection)
        .select(projection)
        .exec((err, personnel) => callback(personnel))
    },

    /**
     * Funzione che ricera una Persona in base all'id.
     */
    findById: (aId, projection, callback) => {
        models.Personnel.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec((err, personnel) => {
            callback(personnel);
        });
    },
    /**
     * Funzione che ricera una Persona in base al CF.
     */
    findByCf: (aCf, projection, callback) => {
        models.Personnel.findOne()
        .where('cf').equals(aCf)
        .select(projection)
        .exec((err, personnel) => {
            callback(personnel);
        });
    },
    
    /**
     * Funzione che ricera una Persona in base all'idTelegram.
     */
	findByIdTelegram: (aIdTelegram, projection, callback) => {
        models.Personnel.findOne()
        .where('telegramData.idTelegram').equals(aIdTelegram)
        .select(projection)
        .exec((err, personnel) => {
            callback(personnel);
        });
    },

    findByCfSync: (aCf, projection) => {
        var ret = null;
        models.Personnel.findOne()
        .where('cf').equals(aCf)
        .select(projection)
        .exec((err, personnel) => {
            ret = personnel;
        });
        while (ret == null)
            deasync.runLoopOnce();
        return ret;
    }

};

/**
 * Funzioni relative ai Droni
 */
exports.Drone = Drone = {
    /**
     * Funzione che inserisce un Drone.
     * L'Operatore Aereo e la Base a cui il Drone appartiene vengono recuperati da una query
     * in base al nome dell'Operatore e della Base.
     * Quando la query viene eseguita aggiorno la Base a cui il Drone appartiene.
     * 
     * @param {Personnel} aPersonnel
     */
    insert: aDrone => {
        AirOperator.findByName(aDrone.airOperator, '_id', aAirOperator => {
            Base.findByName(aDrone.base, '_id', aBase => {
                aDrone._id = mongoose.Types.ObjectId();
                aDrone.airOperator = aAirOperator._id;
                aDrone.base = aBase._id;
                new models.Drone(aDrone)
                .save((err, drone) => {
                    if (err)
                        return console.log(err);
                    console.log('Inserted new Drone with id: ' + drone._id);
                    // Emetto evento insert
                    eventEmitters.Db.Drone.emit('insert')
                    // Il drone deve essere aggiunto alla lista di droni della base corrispondente
                    Base.updateById(drone.base, {$push: {drones: drone._id}});
                });
            });
        });
    },

    /**
     * Funzione che esegue l'update del Drone.
     * @param {} selection parametro usato per la selezione del documento su cui eseguire l'update
     * @param {} newValues parametro con i nuovi valori da inserire
     */
    update: (selection, newValues) => {
        models.Drone.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            // Emetto l'evento update
            eventEmitters.Db.Drone.emit('update')
            console.log(`Updated Drone selected by: ${JSON.stringify(selection)}`)
        })
    },

    /**
     * Funzione che esegue l'operazione di update selezionando il Drone per numero di targa.
     */
    updateByNumber: (aNumber, newValues) => Drone.update({number: aNumber}, newValues),
    /**
     * Funzione che esegue l'operazione di update selezionando il Drone per id.
     */
    updateById: (aId, newValues) => Drone.update({_id: aId}, newValues),
    
    /**
     * Funzione che ricercaa un Drone in base all'id.
     */
    findById: (aId, projection, callback) => {
        models.Drone.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec((err, doc) => callback(doc))
    },

    /**
     * Funzione che ricercaa un drone in base al tipo e ai parametri inseriti in selection.
     * @param {String} aType il tipo di drone da cercare
     * @param {String} selection parametri di reicerca del drone
     * @param {String} aType attributi da restituire
     * @param {Function} aType funzione di callback a cui è passato il drone recuperato
     */
    findByType: (aType, selection, projection, callback) => {
        models.Drone.find(selection)
        .where('type').equals(aType)
        .select(projection)
        .exec((err, doc) => {
            callback(doc);
        });
    },

    findByTypeSync: (aType, projection = null) => {
        var ret = null;
        models.Drone.find()
        .where('type').equals(aType)
        .select(projection)
        .exec((err, doc) => {
            ret = doc;
        });
        while (ret == null)
            deasync.runLoopOnce();
        return ret;
    },

    /**
     * Funzione che ricercaa un Drone in base al numero di targa.
     */
    findByNumber: (aNumber, projection, callback) => {
        models.Drone.findOne()
        .where('number').equals(aNumber)
        .select(projection)
        .exec((err, doc) => {
            callback(doc);
        });
    },

    findByNumberSync: (aNumber, projection) =>  {
        var ret = null;
        models.Base.findOne()
        .where('number').equals(aNumber)
        .select(projection)
        .exec((err, doc) => {
            ret = doc;
        });
        while (ret == null)
            deasync.runLoopOnce();
        return ret;
    }
};

exports.Battery = Battery = {
    insert: aBattery => {
        aBattery._id = mongoose.Types.ObjectId()
        new models.Battery(aBattery)
        .save((err, battery) => {
            if (err) return console.log(err)

            // Emetto evento insert
            eventEmitters.Battery.Db.emit('insert', battery)
            console.log(`Iserted Battery with id: ${battery._id}`)
        })
    }
}

exports.Mission = Mission = {
    insert: aMission => {
        aMission._id = mongoose.Types.ObjectId()
        new models.Mission(aMission)
        .save((err, mission) => {
            if (err) return console.log(err)
            console.log(`Inserted Mission with id: ${mission._id}`)
            // Viene aggiunta la missione alle pending missions del Supervisor
            Personnel.updateById(mission.supervisor, {$push: {'missions.supervisor.pending': mission._id}})

            // Setto i droni come non disponibili e aggiungo la missione alle waitingForQtb del drone
            mission.drones.forEach(drone => Drone.updateById(drone._id, {'state.availability': 1, $push: {'missions.waitingForQtb': {idMission: mission._id, date: new Date(mission.date)}}}))

            // Emetto l'evento missione inserita
            eventEmitters.Db.Mission.emit('insert', mission)

        })

    },
/*
    update: (selection, newValues) => {
        models.Mission.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            // Emetto l'evento update
            eventEmitters.Db.Mission.emit('update')
            console.log(`Updated Mission selected by: ${JSON.stringify(selection)}`)
        })
    },
*/

    update: (selection, newValues) => {
        return models.Mission.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            // Emetto l'evento update
            eventEmitters.Db.Mission.emit('update')
            console.log(`Updated Mission selected by: ${JSON.stringify(selection)}`)
        }).exec()
    },
/*
    update_promise: (selection, newValues) => {
        return models.Mission.updateOne(selection, newValues, err => {
            if (err) console.log(err)
            console.log('Callback update promise')
        })
        .exec()
    },
*/
    updateById: (aId, newValues) => { return Mission.update({_id: aId}, newValues) },


/*
    updateById: (aId, newValues) => {
        models.Mission.updateOne({_id: aId}, newValues, err => {
            if (err)
                return console.log(err);
        });
    },
*/
    findById: (aId, projection, callback) => {
        models.Mission.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec((err, mission) => {
            callback(mission);
        });
    },

    setStatus: (aId, aStatus) => {
        Mission.updateById(aId, {status: aStatus});
    },

    Pilot: {
        setAsNotified: (aMissionId, aPilotId) => {
            Mission.updateById(aMissionId, {$push: {'pilots.notified': aPilotId}});
        },
        /*
        setAsAccepted: (aMissionId, aPilotId, aDate) => {
            return new Promise((resolve, reject) => {
                Mission.updateById(aMissionId, {$pull: {'pilots.notified': aPilotId}})
                .then(() => 
                    Mission.updateById(aMissionId, {$push: {'pilots.accepted': aPilotId}})
                    .then(() => {
                        Personnel.updateById(aPilotId, {$push: {'missions.pilots.accepted': {idMission: aMissionId, date: aDate}}});
                    }) 
                )
            })

        },*/
        setAsAccepted: (aMissionId, aPilotId, aDate/* Data della missione */) => {
            return new Promise((resolve, reject) => 
                Mission.updateById(aMissionId, {$pull: {'pilots.notified': aPilotId}})
                .then(() => Mission.updateById(aMissionId, {$push: {'pilots.accepted': aPilotId}}))
                .then(() => Personnel.updateById(aPilotId, {$push: {'missions.pilots.accepted': {idMission: aMissionId, date: aDate}}}))
                .then(() => resolve())
                .catch(() => reject())
            )

        },
        setPilotAsChosen: (aMissionId, aPilotId) => {
            Mission.updateById(aMissionId, {$pull: {'pilots.accepted': aPilotId}});
            Mission.updateById(aMissionId, {$push: {'pilots.chosen': aPilotId}});
        }
    },

    Crew: {
        setAsNotified: (aMissionId, aCrewId) => {
            Mission.updateById(aMissionId, {$push: {'crew.notified': aCrewId}});
        },
        setAsAccepted: (aMissionId, aPilotId, aDate) => {
            return new Promise((resolve, reject) => 
                Mission.updateById(aMissionId, {$pull: {'crew.notified': aPilotId}})
                .then(() => Mission.updateById(aMissionId, {$push: {'crew.accepted': aPilotId}}))
                .then(() => Personnel.updateById(aPilotId, {$push: {'missions.crew.accepted': {idMission: aMissionId, date: aDate}}}))
                .then(() => resolve())
                .catch(() => reject())
            )
        },
        /*
        setAsAccepted: (aMissionId, aCrewId) => {
            Mission.updateById(aMissionId, {$pull: {'crew.notified': aCrewId}});
            Mission.updateById(aMissionId, {$push: {'crew.accepted': aCrewId}});
            // Aggiungo la missione a quello accettate dal membro dell'equipaggio
            Personnel.updateById(aCrewId, {$push: {'missions.crew.accepted': {idMission: aMissionId, date: aDate}}});         
        },*/
        setAsChosen: (aMissionId, aCrewId) => {
            Mission.updateById(aMissionId, {$pull: {'crew.accepted': aCrewId}});
            Mission.updateById(aMissionId, {$push: {'crew.chosen': aCrewId}});
        }
    },

    Maintainer: {
        setAsNotified: (aMissionId, aMaintainerId) => {
            Mission.updateById(aMissionId, {$push: {'maintainers.notified': aMaintainerId}});
        },
        setAsAccepted: (aMissionId, aPilotId, aDate) => {
            return new Promise((resolve, reject) => 
                Mission.updateById(aMissionId, {$pull: {'maintainers.notified': aPilotId}})
                .then(() => Mission.updateById(aMissionId, {$push: {'maintainers.accepted': aPilotId}}))
                .then(() => Personnel.updateById(aPilotId, {$push: {'missions.maintainers.accepted': {idMission: aMissionId, date: aDate}}}))
                .then(() => resolve())
                .catch(() => reject())
            )
        },
        /*
        setAsAccepted: (aMissionId, aMaintainerId) => {
            Mission.updateById(aMissionId, {$pull: {'maintainers.notified': aMaintainerId}});
            Mission.updateById(aMissionId, {$push: {'maintainers.accepted': aMaintainerId}});
            // Aggiungo la missione a quello accettate dal manutentore
            Personnel.updateById(aMaintainerId, {$push: {'missions.maintainers.accepted': {idMission: aMissionId, date: aDate}}});
        },*/
        setAsChosen: (aMissionId, aMaintainerId) => {
            Mission.updateById(aMissionId, {$pull: {'maintainers.accepted': aMaintainerId}});
            Mission.updateById(aMissionId, {$push: {'maintainers.chosen': aMaintainerId}});
        }
    },

    // pilots, crew, maintainers sono array
    // Quando viene scelto un team la missione passa a running
    addTeam: (aMissionId, chiefPilotId, coPilotId, crewIds, maintainersIds) => {
        Mission.updateById(aMissionId, {$push: {teams: {
            pilots: {
                chief: chiefPilotId,
                co: coPilotId
            },
            crew: crewIds,
            maintainers: maintainersIds
        }}})
        Personnel.updateById(chiefPilotId, {$push: {'missions.pilot.waitingForLogbook': aMissionId}})
        Personnel.updateById(coPilotId, {$push: {'missions.pilot.waitingForLogbook': aMissionId}})
        crewIds.forEach(id => Personnel.updateById(id, {$push: {'missions.crew.pending': aMissionId}}))
        maintainersIds.forEach(id => Personnel.updateById(id, {$push: {'missions.maintainer.pending': aMissionId}}))
        Mission.setStatus(aMissionId, 2)
    },

    // TODO: la missione passa a completata, nel personale crew e maintainer la missione passa a completed
    complete: aMissionId => {

    },

    findByIdSync: (aId, projection) => {
        var ret = null;
        models.Mission.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec((err, doc) => {
            ret = doc;
        });

        while (ret == null)
            deasync.runLoopOnce();
        return ret;
    }
};

exports.Logbook = Logbook = {
    insert: aLogbook => {
        aLogbook._id = mongoose.Types.ObjectId();
        new models.Logbook(aLogbook)
        .save((err, logbook) => {
            if (err) return console.log(err)
            // Aggiungo il logbook alla missione
            Mission.updateById(logbook.mission, {$push: {logbooks: logbook._id}});
            // Aggiungo la missione di cui è stato inserito il logbook tra le missioni completate del pilota che lo ha inserito
            Personnel.updateById(logbook.pilot, {$pull: {'missions.pilot.waitingForLogbook': logbook.mission}});
            Personnel.updateById(logbook.pilot, {$push: {'missions.pilot.completed': logbook.mission}});
            
            eventEmitters.Db.Logbook.emit('insert', logbook)
            console.log(`Inserted Logbook with id: ${logbook._id}`)
        });
    },

    update: (selection, newValues) => {
        models.Logbook.updateOne(selection, newValues, err => {
            if (err) return console.log(err)

            eventEmitters.Db.Logbook.emit('update')
            console.log(`Updated Logbook selected by: ${JSON.stringify(selection)}`)
        });
    },

    updateById: (aId, newValues) => Logbook.update({_id: aId}, newValues),

    findById: (aId, projection, callback) => {
        models.Logbook.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec((err, logbook) => {
            callback(logbook);
        });
    },

    findByIdSync: (aId, projection) => {
        var ret = null;
        models.Logbook.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec((err, doc) => {
            ret = doc;
        });

        while (ret == null)
            deasync.runLoopOnce();
        return ret;
    }
};

exports.Qtb = Qtb = {
    insert: aQtb => {
        aQtb._id = mongoose.Types.ObjectId();
        new models.Qtb(aQtb)
        .save((err, qtb) => {
            if (err) return console.log(err)

            Mission.updateById(qtb.mission, {$push: {qtb: qtb._id}});
            Drone.updateById(qtb.drone, {$pull: {'missions.waitingForQtb': qtb.mission}});
            Drone.updateById(qtb.drone, {$push: {'missions.completed': qtb.mission}});

            eventEmitters.Db.Qtb.emit('insert', qtb)
            console.log(`Inserted Qtb with id: ${qtb._id}`)
        });
    },

    update: (selection, newValues) => {
        models.Qtb.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            eventEmitters.Db.Qtb.emit('update')
            console.log(`Updated Qtb selected by: ${JSON.stringify(selection)}`)
        });
    },

    updateById: (aId, newValues) => Qtb.update({_id: aId}, newValues),
/*
    updateById: (aId, newValues) => {
        models.Qtb.updateOne({_id: aId}, newValues, err => {});
    },
*/
    findById: (aId, projection, callback) => {
        models.Qtb.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec((err, qtb) => {
            callback(qtb);
        });
    },

    findByIdSync: (aId, projection) => {
        var ret = null;
        models.Qtb.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec((err, doc) => {
            ret = doc;
        });

        while (ret == null)
            deasync.runLoopOnce();
        return ret;
    }
};