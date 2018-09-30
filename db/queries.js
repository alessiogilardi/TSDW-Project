const mongoose      = require('mongoose');
const models        = require('./models.js');
const deasync       = require('deasync');
var eventEmitters   = require('../event-emitters');

exports.AirOperator = AirOperator = {
    insert: aAirOperator => {
        aAirOperator._id = mongoose.Types.ObjectId();
        new models.AirOperator(aAirOperator)
        .save((err, airOperator) => {
            if (err)
                return console.log(err);
            console.log('Inserted new AirOperator with id: ' + airOperator._id);

            // Emetto l'evento insert
            eventEmitters.AirOperator.emit('insert', airOperator)
        });

    },

    update: (selection, newValues) => {
        models.AirOperator.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            // Emetto l'evento update
            eventEmitters.AirOperator.emit('update')
            console.log(`Updated AirOperator selected by: ${selection}`);
        })
    },

    updateByName: (aName, newValues) => AirOperator.update({name: aName}, newValues),

    updateById: (aId, newValues) => AirOperator.update({_id: aId}, newValues),

/*
    updateByName: (aName, newValues) => {
        models.AirOperator.updateOne({name: aName}, newValues, err => {
            if (err)
                return console.log(err);
            console.log('Updated AirOperator with name: ' + aName);
        });
    },

    updateById: (aId, newValues) => {
        models.AirOperator.updateOne({_id: aId}, newValues, err => {
            if (err)
                return console.log(err);
            console.log('Updated AirOperator with _id: ' + aId);
    });
    },
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

exports.Base = Base = {
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
                eventEmitters.Base.emit('insert', base)
                // Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
                AirOperator.updateById(base.airOperator, {$push: {'bases': base._id}});
            });
        });
    },

    update: (selection, newValues) => {
        models.Base.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            eventEmitters.Base.emit('update')
            console.log(`Updated Base selected by: ${selection}`)
        })
    },

    updateByName: (aName, newValues) => Base.update({name: aName}, newValues),
    updateById: (aId, newValues) => Base.update({_id: aId}, newValues),
/*
    updateByName: (aName, newValues) => {
        models.Base.updateOne({name: aName}, newValues, err => {
            if (err)
                console.log(err);
            console.log('Updated Base with name: ' + aName);
        });
    },

    updateById: (aId, newValues) => {
        models.Base.updateOne({_id: aId}, newValues, err => {
            if (err)
                console.log(err);
            console.log('Updated Base with id: ' + aId);
        });
    },
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

exports.Personnel = Personnel = {
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
                    eventEmitters.emit('insert', personnel)

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
                        Base.updateById(personnel.base, {'roles.baseSupervisor': personnel._id});
                });
            });
        });
    },

    update: (selection, newValues) => {
        models.Personnel.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            // Emetto evento update
            eventEmitters.Personnel.emit('update')
            console.log(`Updated Personnel selected by: ${selection}`)
        })
    },

    updateByCf: (aCf, newValues) => Personnel.update({cf: aCf}, newValues),
    updateById: (aId, newValues) => Personnel.update({_id: aId}, newValues),
    updateByIdTelegram: (aIdTelegram, newValues) => Personnel.update({'telegramData.idTelegram': aIdTelegram}, newValues),

    /*

    updateByCf: (aCf, newValues) => {
        models.Personnel.updateOne({cf: aCf}, newValues, (err) => {
            if (err)
                return console.log(err);
            console.log('Updated Personnel with CF: ' + aCf);
        });
    },

    updateById: (aId, newValues) => {
        models.Personnel.updateOne({_id: aId}, newValues, err => {
            if (err)
                return console.log(err);
            console.log('Updated Personnel with id: ' + aId);
        });
    },

    updateByIdTelegram: (aIdTelegram, newValues) => {
        models.Personnel.updateOne({'telegramData.idTelegram': aIdTelegram}, newValues, err => {
            if (err)
                return console.log(err);
            console.log('Updated Personnel with idTelegram: ' + aIdTelegram);
        });
    },
*/

    // TODO: Bisogna migliorare la possibilità di ricerca per poter filtrare le persone adatte alla missione


    findByCf: (aCf, projection, callback) => {
        models.Personnel.findOne()
        .where('cf').equals(aCf)
        .select(projection)
        .exec((err, personnel) => {
            callback(personnel);
        });
    },
	
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

exports.Drone = Drone = {
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
                    eventEmitters.Drone.emit('insert')
                    // Il drone deve essere aggiunto alla lista di droni della base corrispondente
                    Base.updateById(drone.base, {$push: {drones: drone._id}});
                });
            });
        });
    },

    update: (selection, newValues) => {
        models.Drone.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            // Emetto l'evento update
            eventEmitters.Drone.emit('update')
            console.log(`Updated Drone selected by: ${selection}`)
        })
    },

    updateByNumber: (aNumber, newValues) => Drone.update({number: aNumber}, newValues),
    updateById: (aId, newValues) => Drone.update({_id: aId}, newValues),
    

    /*
    updateByNumber: (aNumber, newValues) => {
        models.Drone.updateOne({number: aNumber}, newValues, (err) => {
            if (err)
                return console.log(err);
            console.log('Updated Drone with number: ' + aNumber);
        });
    },

    updateById: (aId, newValues) => {
        models.Drone.updateOne({_id: aId}, newValues, (err) => {
        if (err)
            return console.log(err);
        console.log('Updated Drone with id: ' + aId);
        });
    },
*/
    // TODO: trovare i droni per tipo e per disponibilità, quindi bisogna ampliare la query
    findByType: (aType, projection, callback) => {
        models.Drone.find()
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
            eventEmitters.Battery.emit('insert', battery)
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
            // Viene aggiunta la missione alle pending missions del Supervisor
            Personnel.updateById(mission.supervisor, {$push: {'missions.supervisor.pending': mission._id}})

            // Emetto l'evento missione inserita
            eventEmitters.Mission.emit('insert', mission)

            console.log(`Inserted Mission with id: ${mission._id}`)
        })

    },

    update: (selection, newValues) => {
        models.Mission.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            // Emetto l'evento update
            eventEmitters.Mission.emit('update')
            console.log(`Updated Mission selected by: ${selection}`)
        })
    },

    updateById: (aId, newValues) => Mission.update({_id: aId}, newValues),


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

    /**
     * TODO:
     * Modificare struttura in questo modo:
     * {
     *      Pilot: {
     *          setNotified(),
     *          setAccepted(),
     *          setChosen()
     *      }
     * }
     * 
     *  oppure 
     * 
     * {
     *      Notified: {
     *          setPilot(),
     *          setCrew(),
     *          setMaintainer()
     *      }
     * }
     */

    /* Funzioni per aggiungere personale ai Notificati */
    setPilotAsNotified: (aMissionId, aPilotId) => {
        // Assicurarsi prima che aPilotId corrisponda effettivamente a un pilota ????
        Mission.updateById(aMissionId, {$push: {'pilots.notified': aPilotId}});
    },

    setCrewAsNotified: (aMissionId, aCrewId) => {
        Mission.updateById(aMissionId, {$push: {'crew.notified': aCrewId}});
    },

    setMaintainerAsNotified: (aMissionId, aMaintainerId) => {
        Mission.updateById(aMissionId, {$push: {'maintainer.notified': aMaintainerId}});
    },

    /* Funzioni per aggiungere personale agli Accepted */
    setPilotAsAccepted: (aMissionId, aPilotId) => {
        Mission.updateById(aMissionId, {$pull: {'pilots.notified': aPilotId}});
        Mission.updateById(aMissionId, {$push: {'pilots.accepted': aPilotId}});
    },

    setCrewAsAccepted: (aMissionId, aCrewId) => {
        Mission.updateById(aMissionId, {$pull: {'crew.notified': aCrewId}});
        Mission.updateById(aMissionId, {$push: {'crew.accepted': aCrewId}});
    },
    
    setMaintainerAsAccepted: (aMissionId, aMaintainerId) => {
        Mission.updateById(aMissionId, {$pull: {'maintainers.notified': aMaintainerId}});
        Mission.updateById(aMissionId, {$push: {'maintainers.accepted': aMaintainerId}});
    },

    /* Funzioni per aggiungere personale ai Chosen */
    setPilotAsChosen: (aMissionId, aPilotId) => {
        Mission.updateById(aMissionId, {$pull: {'pilots.accepted': aPilotId}});
        Mission.updateById(aMissionId, {$push: {'pilots.chosen': aPilotId}});
    },

    setCrewAsChosen: (aMissionId, aCrewId) => {
        Mission.updateById(aMissionId, {$pull: {'crew.accepted': aCrewId}});
        Mission.updateById(aMissionId, {$push: {'crew.chosen': aCrewId}});
    },
    
    setMaintainerAsChosen: (aMissionId, aMaintainerId) => {
        Mission.updateById(aMissionId, {$pull: {'maintainers.accepted': aMaintainerId}});
        Mission.updateById(aMissionId, {$push: {'maintainers.chosen': aMaintainerId}});
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
            
            eventEmitters.Logbook.emit('insert', logbook)
            console.log(`Inserted Logbook with id: ${logbook._id}`)
        });
    },

    update: (selection, newValues) => {
        models.Logbook.updateOne(selection, newValues, err => {
            if (err) return console.log(err)

            eventEmitters.Logbook.emit('update')
            console.log(`Updated Logbook selected by: ${selection}`)
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

            eventEmitters.Qtb.emit('insert', qtb)
            console.log(`Inserted Qtb with id: ${qtb._id}`)
        });
    },

    update: (selection, newValues) => {
        models.Qtb.updateOne(selection, newValues, err => {
            if (err) return console.log(err)
            eventEmitters.Qtb.emit('update')
            console.log(`Updated Qtb selected by: ${selection}`)
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