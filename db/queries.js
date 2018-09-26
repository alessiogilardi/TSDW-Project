const mongoose  = require('mongoose');
const models    = require('./models.js');
const deasync   = require('deasync');
var events      = require('events');


/**
 * Ho seri dubbi sugli inserimenti:
 * non sarebbe meglio che le funzioni insert ricevano informazioni complete da inserire
 * e che eventuali ricerch di dati mancanti vengano fatte all'esterno della funzione?
 */

exports.AirOperator = AirOperator = {
    insert: (aAirOperator) => {
        aAirOperator._id = mongoose.Types.ObjectId();
        new models.AirOperator(aAirOperator)
        .save((err, airOperator) => {
            if (err)
                return console.log(err);
            console.log('Inserted new AirOperator with id: ' + airOperator._id);
        });

    },

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
    insert: (aBase) => {
        AirOperator.findByName(aBase.airOperator, '_id', aAirOperator => {
            aBase._id = mongoose.Types.ObjectId();
            aBase.airOperator = aAirOperator._id
            new models.Base(aBase)
            .save((err, base) => {
                if (err)
                    return console.log(err);
                console.log('Inserted new base with _id: ' + base._id);
                // Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
                AirOperator.updateById(base.airOperator, {$push: {'bases': base._id}});
            });
        });
    },

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
    insert: (aPersonnel) => {
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

    updateByCf: (aCf, newValues) => {
        models.Personnel.updateOne({cf: aCf}, newValues, (err) => {
            if (err)
                return console.log(err);
            console.log('Updated Personnel with CF: ' + aCf);
        });
    },

    updateById: (aId, newValues) => {
        models.Personnel.updateOne({_id: id}, newValues, err => {
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
                    // Il drone deve essere aggiunto alla lista di droni della base corrispondente
                    Base.updateById(drone.base, {$push: {drones: drone._id}});
                });
            });
        });
    },

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

    findByType: (aType, projection, callback) => {
        models.Drone.findOne()
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
        aBattery._id = mongoose.Types.ObjectId();
        new models.Battery(aBattery)
        .save((err, battery) => {

        });
    }
};

exports.Mission = Mission = {
    insert: aMission => {
        aMission._id = mongoose.Types.ObjectId();
        new models.Mission(aMission)
        .save((err, mission) => {
            if (err)
                return console.log(err);
            // Viene aggiunta la missione alle pending missions del Supervisor
            Personnel.updateById(mission.supervisor, {$push: {'missions.supervisor.pending': mission._id}});   
        });

    },

    updateById: (aId, newValues) => {
        models.Mission.updateOne({_id: aId}, newValues, err => {
            if (err)
                return console.log(err);
        });
    },

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

    /* Funzioni per aggiungere personale ai Notificati */
    setPilotAsNotified: (aMissionId, aPilotId) => {
        // Assicurarsi prima che aPilotId corrisponda effettivamente a un pilota
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
            // Aggiungo il logbook alla missione
            Mission.updateById(logbook.mission, {$push: {logbooks: logbook._id}});
            // Aggiungo la missione di cui è stato inserito il logbook tra le missioni completate del pilota che lo ha inserito
            Personnel.updateById(logbook.pilot, {$pull: {'missions.pilot.waitingForLogbook': logbook.mission}});
            Personnel.updateById(logbook.pilot, {$push: {'missions.pilot.completed': logbook.mission}});
        });
    },

    updateById: (aId, newValues) => {
        models.Logbook.updateOne({_id: aId}, newValues, err => {});
    },

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
            Mission.updateById(qtb.mission, {$push: {qtb: qtb._id}});
            Drone.updateById(qtb.drone, {$pull: {'missions.waitingForQtb': qtb.mission}});
            Drone.updateById(qtb.drone, {$push: {'missions.completed': qtb.mission}});
        });
    },

    updateById: (aId, newValues) => {
        models.Qtb.updateOne({_id: aId}, newValues, err => {});
    },

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