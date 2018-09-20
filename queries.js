const mongoose  = require('mongoose');
const models    = require('./models.js');
const deasync   = require('deasync');

exports.AirOperator = AirOperator = {

  insert: (aName, aCountry, aCity, aAddress, aAM = undefined, aCQM = undefined, aSM = undefined, aBases = []) => {
    new models.AirOperator({
      _id: new mongoose.Types.ObjectId(),
      name: aName,
      location: {
        country: aCountry,
        city: aCity,
        address: aAddress
      },
      roles: {
        AM: aAM,
        CQM: aCQM,
        SM: aSM
      },
      bases: aBases
    }).save((err, airOperator) => {
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
      callback(err, doc);
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

  insert: (aName, aAirOperatorName, aCountry, aCity, aAddress, aLatitude = undefined, aLongitude = undefined, aViceAM = undefined, aBaseSupervisor = undefined, aPilots = undefined, cCrew = undefined, aMainteiners = undefined, aDrones = []) => {
    AirOperator.findByName(aAirOperatorName, '_id', (err, aAirOperator) => {
      if (err)
        return console.log(err);
        
      new models.Base({
        _id: new mongoose.Types.ObjectId(),
        name: aName,
        airOperator: aAirOperator._id,
        location: {
          country: aCountry,
          city: aCity,
          address: aAddress,
          coordinates: {
            latitude: aLatitude,
            longitude: aLongitude
          }
        },
        roles: {
          ViceAM: aViceAM,
          BaseSupervisor: aBaseSupervisor
        },
        staff: {
          pilots: aPilots,
          crew: aCrew,
          mainteiners: aMainteiners
        },
        drones: aDrones
      }).save((err, base) => {
          if (err)
            return console.log(err);
          
          console.log('Inserted new base with _id: ' + base._id);
          // Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
          AirOperator.updateById(base.airOperator, {$push: {'bases': base._id}});
      });
    });
  },
  
  updateByName: (aName, newValues) => {
    models.Base.updateOne({name: aName}, newValues, (err) => {
      if (err)
        console.log(err);
      console.log('Updated Base with name: ' + aName);
    });
  },

  updateById: (aId, newValues) => {
    models.Base.updateOne({_id: aId}, newValues, (err) => {
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
      callback(err, doc);
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
  
  insert: (aIdTelegram, aName, aSurname, aCf, aCountry, aCity, aAddress, aAirOperatorName, aBaseName, aOccupation, aAirOperatorRole = undefined, aBaseRole = undefined, aLocPermission = false, aLicenseId = undefined, aLicenseType = undefined, aLicenseMaxMissionRank = undefined, aLicenseExpireDate = undefined, aDroneTypes = undefined) => {
    AirOperator.findByName(aAirOperatorName, '_id', (err, aAirOperator) => {
      Base.findByName(aBaseName, '_id', (err, aBase) => {
        new models.Personnel({
          _id: mongoose.Types.ObjectId(),
          idTelegram: aIdTelegram,
          name: aName,
          surname: aSurname,
          cf: aCf,
          location: {
              country: aCountry,
              city: aCity,
              address: aAddress
          },
          airOperator: aAirOperator._id,
          base: aBase._id,
          roles: {
              command: {
                  airOperator: aAirOperatorRole, // AM, CQM, SM 
                  base: aBaseRole // ViceAM, Supervisor // Array di ruoli base
              },
              occupation: aOccupation // pilot, crew, maintainer // Array di occupazioni
          },
          pilot: {
              license: {
                  id: aLicenseId,
                  type: aLicenseType,
                  maxMissionRank: aLicenseMaxMissionRank,
                  expiring: aLicenseExpireDate
              },
              droneTypes: aDroneTypes
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
                  completed: [],
              },
              maintainers:  {
                  completed: [],
              },
          },
          locPermission: aLocPermission
        }).save((err, personnel) => {
          if (err)
            return console.log(err);
          console.log('Inserted new Personnel with id: ' + personnel._id);
          
          // Inserisco i vincoli di integrità

          // Aggiorno le occupazioni in base
          if (personnel.roles.occupation.includes('pilot'))
            Base.updateById(personnel.base, {$push: {'staff.pilots': personnel._id}});
          if (personnel.roles.occupation.includes('crew'))
            Base.updateById(personnel.base, {$push: {'staff.crew': personnel._id}});
          if (personnel.roles.occupation.includes('maintainer'))
            Base.updateById(personnel.base, {$push: {'staff.maintainers': personnel._id}});

          // Aggiorno i ruoli di comando
          if (personnel.roles.command.airOperator.includes('AM'))
            AirOperator.updateById(personnel.airOperator, {'roles.AM': personnel._id});
          if (personnel.roles.command.airOperator.includes('CQM'))
            AirOperator.updateById(personnel.airOperator, {'roles.CQM': personnel._id});
          if (personnel.roles.command.airOperator.includes('SM'))
            AirOperator.updateById(personnel.airOperator, {'roles.SM': personnel._id});
          if (personnel.roles.command.base.includes('ViceAM'))
            Base.updateById(personnel.base, {'roles.ViceAM': personnel._id});
          if (personnel.roles.command.base.includes('BaseSupervisor'))
            Base.updateById(personnel.base, {'roles.BaseSupervisor': personnel._id});
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
    models.Personnel.updateOne({_id: id}, newValues, (err) => {
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
  insert: (aNumber, aType, aAirOperatorName, aBaseName, aAvailability = 0, aGeneralState = 'OK', aLastMaintenance = undefined, aFligthTimeSinceLastMaintenance = undefined, aNotes = undefined, aNotes = undefined, aMissionsCompleted = [], aMissionsWaitingForQtb = []) => {
    AirOperator.findByName(aAirOperatorName, '_id', (err, aAirOperator) => {
      Base.findByName(aBaseName, '_id', (err, aBase) => {
        new models.Drone({
          _id: mongoose.Types.ObjectId(),
          number: aNumber,
          type: aType,
          airOperator: aAirOperator._id,
          base: aBase._id,
          state: {
              availability: aAvailability, /* 0 -> Disponibile, 1 -> In Uso, 2 -> In manutenzione */
              generalState: aGeneralState, /* Potrebbe non servire */
              lastMaintenance: aLastMaintenance,
              flightTimeSinceLastMaintenance: aFligthTimeSinceLastMaintenance, /* Aggiornato ogni qual volta viene inserito un QTB, campo utilizzato per verificare lo stato di usura */
              notes: aNotes
          },
          missions: {
              completed: aMissionsCompleted,
              waitingForQtb: aMissionsWaitingForQtb /* Missioni per cui non è ancora stato inserito un QTB */
          }
        }).save((err, drone) => {
          if (err)
            return console.log(err);
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
    });
  },
  
  updateById: (aId, newValues) => {
	models.Drone.updateOne({_id: aId}, newValues, (err) => {
	  if (err)
		  return console.log(err);
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
  insert: (aDate, aType, aBase, aSupervisor, aDescription, aFlightPlan) => {
    new models.Mission({
      _id: mongoose.Types.ObjectId(),
      date: aDate,
      location: { /* Da eliminare nel caso */
        longitude: aLongitude, /* Da eliminare nel caso */
        latitude: aLatitude /* Da eliminare nel caso */
      },
      type: aType,
      base: aBase,
      supervisor: aSupervisor, /* Da controllare che il supervisiore afferisca alla base giusta */
      duration: {
          expectedDuration: aExpectedDuration,
          effectiveDuration: aEffectiveDuration
      },
      description: aDescription,
      flightPlan: aFlightPlan,
      drones: [], /*Inseriti successivamente */
      pilots: [], /* Inseriti successivamente */
      equip: [], /* Inseriti successivamente */
      mainteiners: [] /*Inseriti successivamente se la missione ha durata maggiore di 3h */
    }).save((err, mission) => {
      if (err)
        return console.log(err);
      
      // Inserisco una pendingMission al supervisore della base che l'ha richiesta, 
      // in questo modo potrà selezionare in un momento successivo personale e droni
      
      // Dovrebbe essere reso comprensibile se una pendingMission in Personnel sia 
      // di un supervisore che deve finire di definire squadra e droni o
      // di un pilota che ancora non ha inserito il Logbook

    });
  },

  addPilot: (aMissionId, aPilotId) => {
    Mission.updateById(aMissionId, {$push: {pilots: aPilotId}});
    // Aggiungo la missione alle pendingMissions del pilota
    Personnel.updateById(aPilotId, {$push: {'pilot.missions.pending.waitingForLogbook': aMissionId}});
  },

  addEquipMember: (aMissionId, aEquipId) => {
    Mission.updateById(aMissionId, {$push: {equip: aEquipId}});
    // Va aggiunta la missione alle missioni svolte ma bisogna decidere dove inserirla
    // se nelle completate o se rivedere un attimo lo schema personnel
  },

  addMaintainer: (aMissionId, aMaintainerId) => {
    Mission.updateById(aMissionId, {$push: {maintainers: aMaintainerId}});
    // Va aggiunta la missione alle missioni svolte ma bisogna decidere dove inserirla
    // se nelle completate o se rivedere un attimo lo schema personnel
  },

  addDrone: (aMissionId, aDroneId) => {
    Mission.updateById(aMissionId, {$push: {drones: aDroneId}});
    // Aggiungo la missione alle pendingMissions del drone
    Drone.updateById(aDroneId, {$push: {pendingMissions: aMissionId}});
  },

  updateById: (aId, newValues) => {
    models.Mission.updateOne({_id: aId}, newValues, err => {
      if (err)
        return console.log(err);
    });
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
    insert: () => {

    },

    updateById: (aId, newValues) => {
        models.Logbook.updateOne({_id: aId}, newValues);
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
    insert: () => {

    },
    
    updateById: (aId, newValues) => {
        models.Qtb.updateOne({_id: aId}, newValues);
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

