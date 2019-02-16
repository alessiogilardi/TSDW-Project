/**
 * Modulo di interazione con il db.
 * Qui vengono dichiarate le funzioni che eseguono query al db.
 * Le funzioni resituiscono una Promise del risultato.
 */

const mongoose  = require('mongoose')
const models    = require('./models')
const ee        = require('../events/event-emitters')
const bf        = require('../bot/bot-functions')

/**
 * Funzioni relative all'Operatore Aereo
 */
exports.AirOperator = AirOperator = {
    /**
     * Funzione che inserisce un Operatore Aereo.
     * 
     * @param {AirOperator} aAirOperator
     */
    insert: async aAirOperator => {
        return new Promise((resolve, reject) => {
            aAirOperator._id = mongoose.Types.ObjectId();
            new models.AirOperator(aAirOperator)
            .save((err, airOperator) => {
                if (err) return reject(err)

                console.log('Inserted new AirOperator with id: ' + airOperator._id);
                // Emetto l'evento insert
                ee.db.AirOperator.emit('insert', airOperator)
                resolve(airOperator)
            })
        })
        

    },

    /**
     * Funzione che esegue l'update dell'Operatore Aereo.
     * @param {Object} selection parametro usato per la selezione del documento di cui eseguire l'update
     * @param {Object} newValues parametro con i nuovi valori da inserire
     */
    update: (selection, newValues) => {
        return new Promise((resolve, reject) => {
            models.AirOperator.updateOne(selection, newValues, err => {
                if (err) return reject(err)
                // Emetto l'evento update
                ee.db.AirOperator.emit('update')
                console.log(`Updated AirOperator selected by: ${JSON.stringify(selection)}`)
                resolve()
            })
        })
        
    },

    /**
     * Funzione che esegue l'operazione di update selezionando l'Operatore Aereo per nome.
     * @param   {String} aName     Nome dell'Operatore Aereo
     * @param   {Object} newValues Nuovi valori
     * @returns {Promise}
     */
    updateByName: (aName, newValues) => { return AirOperator.update({name: aName}, newValues) },

    /**
     * Funzione che esegue l'operazione di update selezionando l'Operatore Aereo per id.
     * @param   {ObjectId}    aId         _id dell'Operatore Aereo
     * @param   {Object}      newValues   Nuovi valori
     * @returns {Promise}
     */
    updateById: (aId, newValues) => { return AirOperator.update({_id: aId}, newValues) },

    /**
     * Funzione che cerca un Operatore Aereo in base al nome.
     * @param {String} aName        Nome dell'Operatore da cercare
     * @param {String} projection   Attributi da cercare
     */
    findByName: (aName, projection) => {
        return models.AirOperator.findOne()
        .where('name').equals(aName)
        .select(projection)
        .exec()
    }
};

/**
 * Funzioni relative alla base
 */
exports.Base = Base = {
    /**
     * Funzione che inserisce una Base.
     * L'Operatore Aereo a cui la base appartiene è recuperato mediante una query in base al nome 
     * dell'Operatore.
     * Quando la query viene eseguita viene aggiunta la Base alla lista delle basi dell'Operatore Aereo.
     * 
     * @param   {Base}  aBase
     * @returns {Promise}
     */
    insert: async aBase => {
        return new Promise(async (resolve, reject) => {
            var airOperator = await AirOperator.findByName(aBase.airOperator, '_id')
            aBase._id = mongoose.Types.ObjectId();
            aBase.airOperator = airOperator._id

            new models.Base(aBase)
            .save((err, base) => {
                if (err) return reject(err)

                console.log('Inserted new base with _id: ' + base._id);
                // Emetto l'evento insert
                ee.db.Base.emit('insert', base)
                // Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
                AirOperator.updateById(base.airOperator, {$push: {'bases': base._id}})
                resolve(base)
            })

        })
    },

    /**
     * Funzione che esegue l'update dela Base.
     * @param   {Object} selection Parametro usato per la selezione del documento di cui eseguire l'update
     * @param   {Object} newValues Parametro con i nuovi valori da inserire
     * @returns {Promise}
     */
    update: (selection, newValues) => {
        return new Promise((resolve, reject) =>
            models.Base.updateOne(selection, newValues, err => {
                if (err) return reject(err)
                ee.db.Base.emit('update')
                console.log(`Updated Base selected by: ${JSON.stringify(selection)}`)
                resolve()
            })
        )
        
    },

    /**
     * Funzione che esegue l'operazione di update selezionando la Base per nome.
     * @param   {String} aName        Nome della Base
     * @param   {Object} newValues    Nuovi valori
     * @returns {Promise}
     */
    updateByName: (aName, newValues) => { return Base.update({name: aName}, newValues) },

    /**
     * Funzione che esegue l'operazione di update selezionando la Base per _id.
     * @param   {String} aId        Nome della Base
     * @param   {Object} newValues  Nuovi valori
     * @returns {Promise}
     */
    updateById: (aId, newValues) => { return Base.update({_id: aId}, newValues) },

    /**
     * Funzione che cerca una Base in base al nome.
     * @param   {String} name      nome della Base da cercare
     * @param   {String} projection attributi da cercare
     * @returns {Promise}
     */
    findByName: (name, projection) => {
        return models.Base.findOne()
            .where('name').equals(name)
            .select(projection)
            .exec()
    },

    /**
     * Funzione che cerca una Base in base all'_id.
     * @param   {String} aId      nome della Base da cercare
     * @param   {String} projection attributi da cercare
     * @returns {Promise}
     */
    findById: (aId, projection) => {
        return models.Base.findOne()
            .where('_id').equals(aId)
            .select(projection)
            .exec()
    },

    /**
     * Funzione che esegue la ricerca di Basi
     * @param   {Object} selection  parametro per selezionare i ducumenti da recuperare
     * @param   {Object} projection parametro per selezionare gli attributi da cercare
     * @returns {Promise}
     */
    find: (selection, projection) => {
        return models.Base.find(selection)
        .select(projection)
        .exec()
    },
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
     * @param   {Personnel} aPersonnel
     * @returns {Promise}
     */
    insert: async aPersonnel => {
        return new Promise(async (resolve, reject) => {
            const airOperator = await AirOperator.findByName(aPersonnel.airOperator, '_id')
            const base        = await Base.findByName(aPersonnel.base, '_id')

            aPersonnel._id          = mongoose.Types.ObjectId();
            aPersonnel.airOperator  = airOperator._id;
            aPersonnel.base         = base._id;

            new models.Personnel(aPersonnel)
            .save((err, personnel) => {
                if (err) {
                    console.log(err)
                    return reject(err)
                }

                console.log('Inserted new Personnel with id: ' + personnel._id)
                // Emetto evento insert
                ee.db.Personnel.emit('insert', personnel)

                // Inserisco i vincoli di integrità

                // Aggiorno le occupazioni in base
                if (personnel.roles.occupation.pilot)
                    Base.updateById(personnel.base, {$push: {'staff.pilots': personnel._id}})
                if (personnel.roles.occupation.crew)
                    Base.updateById(personnel.base, {$push: {'staff.crew': personnel._id}})
                if (personnel.roles.occupation.maintainer)
                    Base.updateById(personnel.base, {$push: {'staff.maintainers': personnel._id}})

                // Aggiorno i ruoli di comando
                if (personnel.roles.command.airOperator.AM)
                    AirOperator.updateById(personnel.airOperator, {'roles.AM': personnel._id})
                if (personnel.roles.command.airOperator.CQM)
                    AirOperator.updateById(personnel.airOperator, {'roles.CQM': personnel._id})
                if (personnel.roles.command.airOperator.SM)
                    AirOperator.updateById(personnel.airOperator, {'roles.SM': personnel._id})

                if (personnel.roles.command.base.viceAM)
                    Base.updateById(personnel.base, {'roles.viceAM': personnel._id})
                if (personnel.roles.command.base.supervisor)
                    Base.updateById(personnel.base, {'roles.supervisor': personnel._id})
                resolve(personnel)
            })

        })
    },

    /**
     * Funzione che esegue l'update del membro del Personale.
     * @param   {Object} selection parametro usato per la selezione del documento su cui eseguire l'update
     * @param   {Object} newValues parametro con i nuovi valori da inserire
     * @returns {Promise}
     */
    update: (selection, newValues) => {
        return new Promise((resolve, reject) => {
            models.Personnel.updateOne(selection, newValues, err => {
                if (err) { 
                    console.log(err)
                    return reject(err)
                }
                // Emetto evento update
                ee.db.Personnel.emit('update')
                console.log(`Updated Personnel selected by: ${JSON.stringify(selection)}`)
                resolve()
            })
        })
    },

    /**
     * Funzione che esegue l'operazione di update selezionando la Persona per CF.
     * @param   {String}    aCf       CF della Persona
     * @param   {Object}    newValues Nuovi valori
     * @returns {Promise}
     */
    updateByCf: (aCf, newValues) => { return Personnel.update({cf: aCf}, newValues) },
    /**
     * Funzione che esegue l'operazione di update selezionando la Persona per id.
     * @param   {ObjectId} aId       _id della persona
     * @param   {Object}   newValues Nuovi valori
     * @returns {Promise}
     */
    updateById: (aId, newValues) => { return Personnel.update({_id: aId}, newValues) },
    /**
     * Funzione che esegue l'operazione di update selezionando la Persona per idTelegram.
     * @param   {Number} aIdTelegram idTelegram della persona
     * @param   {Object} newValues   Nuovi valori
     * @returns {Promise}
     */
    updateByIdTelegram: (aIdTelegram, newValues) => { return Personnel.update({'telegramData.idTelegram': aIdTelegram}, newValues) },

    /**
     * Funzione che esegue la ricerca di membri del Personale.
     * @param   {Object} selection  parametro per selezionare i ducumenti da recuperare
     * @param   {Object} projection parametro per selezionare gli attributi da cercare
     * @returns {Promise}
     */
    find: (selection, projection) => {
        return models.Personnel.find(selection)
        .select(projection)
        .exec()
    },

    /**
     * Funzione che ricera una Persona in base all'id.
     * @param   {ObjectId} aId          _id della persona
     * @param   {Object}   projection   Attributi da cercare
     * @returns {Promise}
     */
    findById: (aId, projection) => {
        return models.Personnel.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec()
    },
    /**
     * Funzione che ricera una Persona in base al CF.
     * @param   {String} aCf        _id della persona
     * @param   {Object} projection Attributi da cercare
     * @returns {Promise}
     */
    findByCf: (aCf, projection) => {
        return models.Personnel.findOne()
        .where('cf').equals(aCf)
        .select(projection)
        .exec()
    },
    
    /**
     * Funzione che ricera una Persona in base all'idTelegram.
     * @param   {Number} aIdTelegram idTelegram della persona da cercare
     * @param   {Object} projection  Attributi da cercare
     * @returns {Promise}
     */
	findByIdTelegram: (aIdTelegram, projection) => {
        return models.Personnel.findOne()
        .where('telegramData.idTelegram').equals(aIdTelegram)
        .select(projection)
        .exec()
    },
}

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
     * @param   {Drone}   aDrone
     * @returns {Promise}
     */
    insert: async aDrone => {
        return new Promise(async (resolve, reject) => {
            var airOperator = await AirOperator.findByName(aDrone.airOperator, '_id')
            var base        = await Base.findByName(aDrone.base, '_id')
            aDrone._id = mongoose.Types.ObjectId()
            aDrone.airOperator = airOperator._id
            aDrone.base = base._id
            new models.Drone(aDrone)
                .save((err, drone) => {
                    if (err) {
                        console.log(err)
                        return reject(err)
                    }
                    console.log('Inserted new Drone with id: ' + drone._id)
                    // Emetto evento insert
                    ee.db.Drone.emit('insert')
                    // Il drone deve essere aggiunto alla lista di droni della base corrispondente
                    Base.updateById(drone.base, {$push: {drones: drone._id}})
                    resolve(aDrone)
            })
        })
    },

    /**
     * Funzione che esegue l'update del Drone.
     * @param {Object} selection parametro usato per la selezione del documento su cui eseguire l'update
     * @param {Object} newValues parametro con i nuovi valori da inserire
     */
    update: (selection, newValues) => {
        return new Promise((resolve, reject) =>
            models.Drone.updateOne(selection, newValues, err => {
                if (err) {
                    console.log(err)
                    return reject(err)
                }
                // Emetto l'evento update
                ee.db.Drone.emit('update')
                console.log(`Updated Drone selected by: ${JSON.stringify(selection)}`)
                resolve()
            })
        )
        
    },

    /**
     * Funzione che esegue l'operazione di update selezionando il Drone per numero di targa.
     * @param {String} aNumber   Numero di targa del Drone
     * @param {Object} newValues Nuovi valori
     */
    updateByNumber: (aNumber, newValues) => { return Drone.update({ number: aNumber }, newValues) },
    /**
     * Funzione che esegue l'operazione di update selezionando il Drone per id.
     * @param {ObjectId} aId
     * @param {Object} newValues
     */
    updateById: (aId, newValues) => { return Drone.update({ _id: aId }, newValues) },
    
    /**
     * Funzione che ricerca un Drone in base all'id.
     * @param {ObjectId} aId
     * @param {String} projection
     * @returns {Promise}
     */
    findById: (aId, projection) => {
        return models.Drone.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec()
    },

    /**
     * Funzione generica di ricerca Droni (Recupera più Droni)
     * @param {Object} selection
     * @param {String} projection
     * @returns {Promise}
     */
    find: (selection, projection) => {
        return models.Drone.find(selection)
        .select(projection)
        .exec()
    },

    /**
     * Funzione che ricerca un drone in base al tipo e ai parametri inseriti in selection.
     * @param {String} aType      Tipo di drone da cercare
     * @param {Object} selection  parametri di reicerca del drone
     * @param {Object} projection attributi da cercare
     * @returns {Promise}
     */
    findByType: (aType, selection, projection) => {
        return models.Drone.find(selection)
        .where('type').equals(aType)
        .select(projection)
        .exec()
    },

    /**
     * Funzione che ricercaa un Drone in base al numero di targa.
     * @param {String} aNumber
     * @param {String} projection
     * @returns {Promise}
     */
    findByNumber: (aNumber, projection) => {
        return models.Drone.findOne()
        .where('number').equals(aNumber)
        .select(projection)
        .exec()
    },
}

/*
exports.Battery = Battery = {
    insert: aBattery => {
        aBattery._id = mongoose.Types.ObjectId()
        new models.Battery(aBattery)
        .save((err, battery) => {
            if (err) return console.log(err)

            // Emetto evento insert
            ee.Battery.db.emit('insert', battery)
            console.log(`Iserted Battery with id: ${battery._id}`)
        })
    }
}
*/
exports.Mission = Mission = {
    /**
     * Funzione che inserisce una nuova Missione.
     * @param {Mission} aMission La missione da inserire
     * @returns {Promise}
     */
    insert: aMission => {
        return new Promise((resolve, reject) => {
            aMission._id = mongoose.Types.ObjectId()
            new models.Mission(aMission)
            .save((err, mission) => {
                if (err) return reject(err)
                console.log(`Inserted Mission with id: ${mission._id}`)

                // Emetto l'evento missione inserita
                ee.db.Mission.emit('insert', mission)

                resolve(aMission)
            })
        })
    },

    /**
     * Funzione che esegue la query di update di una Missione.
     * @param {Object} selection
     * @param {Object} newValues
     * @returns {Promise}
     */
    update: (selection, newValues) => {
        return new Promise((resolve, reject) => {
            models.Mission.updateOne(selection, newValues, err => {
                if (err) {
                    console.log(err)
                    return reject(err)
                }
                // Emetto l'evento update
                ee.db.Mission.emit('update')
                console.log(`Updated Mission selected by: ${JSON.stringify(selection)}`)
                resolve()
            })
        })
    },

    /**
     * Funzione che esegue la query di update di una Missione selezionando per _id.
     * @param {ObjectId} aId
     * @param {Object} newValues
     * @returns {Promise}
     */
    updateById: (aId, newValues) => { return Mission.update({_id: aId}, newValues) },

    /**
     * Funzione che cerca una Missione per _id.
     * @param {ObjectId} aId
     * @param {String} projection
     * @returns {Promise}
     */
    findById: (aId, projection) => {
        return models.Mission.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec()
    },

    /**
     * Funzione di ricerca generica di Missioni (Ritorna più Missioni)
     * @param {Object} selection
     * @param {String} projection
     * @returns {Promise}
     */
    find: (selection, projection) => {
        return models.Mission.find(selection)
        .select(projection)
        .exec()
    },
};

exports.Logbook = Logbook = {
    /**
     * Funzione che inserisce un Logbook.
     * Una volta inserito il Logbook viene aggiunto a quelli della missione,
     * la missione è rimossa dalle waitingForLogbook del Pilota ed aggiunta 
     * alle completed.
     * Infine controllo se la Missione ha tutta la documentazione (Logbook + QTB)
     * e in caso affermativo viene settata come completed.
     * 
     * @param {Logbook} aLogbook
     */
    insert: aLogbook => {
        return new Promise((resolve, reject) => {
            aLogbook._id = mongoose.Types.ObjectId();
            new models.Logbook(aLogbook)
            .save((err, logbook) => {
                if (err) return reject(err)
                console.log(`Inserted Logbook with id: ${logbook._id}`)
                // Aggiungo il logbook alla missione
                Mission.updateById(logbook.mission, { $push: { logbooks: logbook._id } })
                // Aggiungo la missione di cui è stato inserito il logbook tra le missioni completate del pilota che lo ha inserito
                Personnel.updateById(logbook.pilot, { $pull: { 'missions.pilot.waitingForLogbook':   logbook.mission } })
                Personnel.updateById(logbook.pilot, { $push: { 'missions.pilot.completed':           logbook.mission } })
                
                ee.db.Logbook.emit('insert', logbook)
                
                // Controllo se la Missione ha tutti i documenti e in caso affermativo la setta come completed
                bf.checkMissionDocuments(logbook.mission)
                resolve(logbook)
            })

        })   
    },

    /**
     * Funzione che usegue l'update di un Logbook.
     * @param {Object} selection
     * @param {Object} newValues
     * @returns {Promise}
     */
    update: (selection, newValues) => {
        return new Promise((resolve, reject) => {
            models.Logbook.updateOne(selection, newValues, err => {
                if (err) { 
                    console.log(err)
                    return reject(err)
                }
    
                ee.db.Logbook.emit('update')
                console.log(`Updated Logbook selected by: ${JSON.stringify(selection)}`)
                resolve()
            })
        })
    },

    /**
     * Funzione che usegue l'update di un Logbook selezionando per _id.
     * @param {ObjectId} aId
     * @param {Object} newValues
     * @returns {Promise}
     */
    updateById: (aId, newValues) => { return Logbook.update({ _id: aId }, newValues) },

    /**
     * Funzione che cerca un Logbook per _id.
     * @param {ObjectId} aId
     * @param {String} projection
     * @returns {Promise}
     */
    findById: (aId, projection/*, callback*/) => {
        return models.Logbook.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec()
    }
};

exports.Qtb = Qtb = {
    /**
     * Funzione che inserisce un QTB.
     * Una volta inserito il QTB viene aggiunto a quelli della missione,
     * la missione è rimossa dalle waitingForQtb del Drone ed aggiunta 
     * alle completed.
     * Infine controllo se la Missione ha tutta la documentazione (Logbook + QTB)
     * e in caso affermativo viene settata come completed.
     * 
     * @param {Qtb} aQtb
     * @returns {Promise}
     */
    insert: aQtb => {
        aQtb._id = mongoose.Types.ObjectId();
        new models.Qtb(aQtb)
        .save((err, qtb) => {
            if (err) return console.log(err)
            console.log(`Inserted Qtb with id: ${qtb._id}`)

            Mission.updateById(qtb.mission, {$push: {qtb: qtb._id}});
            Drone.updateById(qtb.drone, {$pull: {'missions.waitingForQtb': qtb.mission}});
            Drone.updateById(qtb.drone, {$push: {'missions.completed': qtb.mission}});

            ee.db.Qtb.emit('insert', qtb)
            bf.checkMissionDocuments(logbook.mission)
            
        })
    },

    /**
     * Funzione che esegue l'update di un QTB.
     * @param {Object} selection
     * @param {Object} newValues
     * @returns {Promise}
     */
    update: (selection, newValues) => {
        return new Promise((resolve, reject) => {
            models.Logbook.updateOne(selection, newValues, err => {
                if (err) { 
                    console.log(err)
                    return reject(err)
                }
                ee.db.Qtb.emit('update')
                console.log(`Updated Qtb selected by: ${JSON.stringify(selection)}`)
                resolve()
            })
        })
    },

    /**
     * Funzione che esegue l'update di un QTB selezionando per _id.
     * @param {ObjectId} aId
     * @param {Object} newValues
     * @returns {Promise}
     */
    updateById: (aId, newValues) => { return Qtb.update({_id: aId}, newValues) },

    /**
     * Funzione che cerca un QTB per _id.
     * @param {ObjectId} aId
     * @param {String} projection
     * @returns {Promise}
     */
    findById: (aId, projection) => {
        return models.Qtb.findOne()
        .where('_id').equals(aId)
        .select(projection)
        .exec()
    },
}

exports.EventLog = EventLog = {
    /**
     * Funzione che inserisce un EventLog.
     * Gli EventLog registrano gli eventi di:
     *  - missionRequested
     *  - missionOrganized
     *  - teamCreated
     *  - missionAccepted
     *  - missionDeclined
     *  - missionAborted
     */
    insert: aEvent => {
        return new Promise((resolve, reject) => {
            new models.EventLog(aEvent)
            .save((err, event) => {
                if (err) return reject(err)
                console.log(`Inserted new Event of type: ${event.type}`)
                resolve(event)
            })
        })
    }
}