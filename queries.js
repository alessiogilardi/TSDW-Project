const mongoose  = require('mongoose');
const models    = require('./models.js');
const deasync   = require('deasync');

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

    findByCf: (aCf, projection, callback) => {
        models.Personnel.findOne()
        .where('cf').equals(aCf)
        .select(projection)
        .exec((err, personnel) => {
            callback(personnel);
        });
    },
	
	findByIdTelegram: (aIdTlg, projection, callback) => {
        models.Personnel.findOne()
        .where('idTelegram').equals(aIdTlg)
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
        AirOperator.findByName(aDone.airOperator, '_id', aAirOperator => {
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

exports.Mission = Mission = {
    /**
     * L'inseriemento di una Missione è demandato ad un Supervisore di base mediante Telegram.
     * Quindi presumibilmente posso trovare Supervisor._id e Base._id dal id Telegram
     * 
     * Questi dati vanno trovati prima di inseire la Missione
     */
    insert: aMission => {

    },

    insert_OLD: (aMission) => {
        Personnel.findByCf(aMission.supervisor, '_id, roles', aSupervisor => {
            Base.findByName(aMission.base, '_id, roles', aBase => {
                /* Controllo che chi inserisce la missione sia supervisore nella base specificata */
                if (aSupervisor.roles.command.base.supervisor && 
                        aSupervisor._id === aBase.roles.supervisor) {
                    aMission._id = mongoose.Types.ObjectId();
                    aMission.supervisor = aSupervisor._id;
                    aMission.base = aBase._id;
                    new models.Mission(aMission)
                    .save((err, mission) => {
                        if (err)
                            return console.log(err);

                        // Inserisco una pendingMission al supervisore della base che l'ha richiesta, 
                        // in questo modo potrà selezionare in un momento successivo personale e droni
                        Personnel.updateById(mission.supervisor, {$push: {'missions.supervisor.pending': mission._id}});

                        // Dovrebbe essere reso comprensibile se una pendingMission in Personnel sia 
                        // di un supervisore che deve finire di definire squadra e droni o
                        // di un pilota che ancora non ha inserito il Logbook
                    });
                }
            });
        });
    }
};