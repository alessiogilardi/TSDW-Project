const mongoose  = require('mongoose');
const models    = require('./models.js');
const deasync   = require('deasync');

exports.AirOperator = AirOperator = {

  insert: (oName, oCountry, oCity, oAddress, oAM = undefined, oCQM = undefined, oSM = undefined, oBases = []) => {
    new models.AirOperator({
      _id: new mongoose.Types.ObjectId(),
      name: oName,
      location: {
        country: oCountry,
        city: oCity,
        address: oAddress
      },
      roles: {
        AM: oAM,
        CQM: oCQM,
        SM: oSM
      },
      bases: oBases
    }).save((err) => {
        if (err)
          return console.log(err);
    });
  },

  insert2: (airOperator) => {
    new models.AirOperator({
      _id: new mongoose.Types.ObjectId(),
      name: airOperator.name,
      location: {
        country: airOperator.location.country,
        city: airOperator.location.city,
        address: airOperator.location.address
      },
      roles: {
        AM: airOperator.roles.AM,
        CQM: airOperator.roles.CQM,
        SM: airOperator.roles.SM
      },
      bases: airOperator.bases
    }).save((err) => {
      if (err)
        return console.log(err);
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
  
  /* Nuovo tentativo da fare */
  findByName: (aName, projection, callback) => {
    models.AirOperator.findOne()
    .where('name').equals(aName)
    .select(projection)
    .exec((err, doc) => {
      callback(err, doc);
    });
    /*
    models.AirOperator.findOne()
    .where('name').equals(aName)
    .select(projection)
    .exec((err, doc) => {
      callback(doc);
    });
    */
  },

  // La funzione esterna (findByName) è sincrona, ma la funzione di callback è asincrona. Il valore di ritorno (doc) è conosciuto solo dalla funzione di callback.
  // Dovrei quindi ritornare il valore dalla funzione di callback, ma non posso perché è asincrona.

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

  insert2: (oName, oAirOperator, oCountry, oCity, oAddress, oLatitude = undefined, oLongitude = undefined, oViceAM = undefined, oBaseSupervisor = undefined, oPilots = undefined,
                oEquip = undefined, oMainteiners = undefined, oDrones = []) => {
    AirOperator.findByName(oAirOperator, '_id', (err, doc) => {
      if (err)
        return console.log(err);
        
      new models.Base({
        _id: new mongoose.Types.ObjectId(),
        name: oName,
        airOperator: doc._id,
        location: {
          country: oCountry,
          city: oCity,
          address: oAddress,
          latitude: oLatitude,
          longitude: oLatitude,
        },
        roles: {
          ViceAM: oViceAM,
          BaseSupervisor: oBaseSupervisor
        },
        staff: {
          pilots: oPilots,
          equip: oEquip,
          mainteiners: oMainteiners
        },
        drones: oDrones
      }).save((err, base) => {
        // results contiene il documento json della base appena creata
          if (err)
            return console.log(err);
          console.log('Inserted new base with _id: ' + base._id);
          // Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
          AirOperator.updateById(base.airOperator, {$push: {'bases': base._id}});
      });

    });
  },
	
  insert: (oName, oAirOperator, oCountry, oCity, oAddress, oLatitude = undefined, oLongitude = undefined, oViceAM = undefined, oBaseSupervisor = undefined, oPilots = undefined,
                oEquip = undefined, oMainteiners = undefined, oDrones = []) => {
	 // Prima cerco l'id dell'operatore aereo conoscendone il nome (oAirOperator)
  	new models.Base({
  		_id: new mongoose.Types.ObjectId(),
  		name: oName,
  		airOperator: AirOperator.findByNameSync(oAirOperator, '_id')._id,
  		location: {
  			country: oCountry,
  			city: oCity,
  			address: oAddress,
  			latitude: oLatitude,
  			longitude: oLatitude,
  		},
  		roles: {
  			ViceAM: oViceAM,
  			BaseSupervisor: oBaseSupervisor
  		},
  		staff: {
  			pilots: oPilots,
  			equip: oEquip,
  			mainteiners: oMainteiners
  		},
  		drones: oDrones
  	}).save((err, base) => {
    	// results contiene il documento json della base appena creata
        if (err)
          return console.log(err);
        // Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
        AirOperator.updateById(base.airOperator, {$push: {'bases': base._id}});
  	});
  },
  
  updateByName: (aName, newValues) => {
    models.Base.updateOne({name: aName}, newValues, (err) => {
      if (err)
        console.log(err);
    });
  },

  updateById: (aId, newValues) => {
    models.Base.updateOne({_id: aId}, newValues, (err) => {
      if (err)
        console.log(err);
    });
  },

  findByName: (name, projection, callback) => {
    models.Base.findOne()
    .where('name').equals(name)
    .select(projection)
    .exec(callback(err, doc));
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
	
  insert: (aIdTelegram, aName, aSurname, aCf, aCountry, aCity, aAddress, aAirOperatorName, aBaseName, aRoles = [], aMissions = [], aLocPermission = false, aLicenseId = undefined, aLicenseType = undefined, aLicenseExpireDate = undefined, aDroneTypes = undefined) => {
    AirOperator.findByName(aAirOperatorName, '_id', (aAirOperator) => {
      Base.findByName(aBaseName, '_id', (aBase) => {
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
          roles: aRoles,
          missions: aMissions,
          locPermission: aLocPermission,
          pilotInfo: {
              license: {
                  id: aLicenseId,
                  type: aLicenseType,
                  expiring: aLicenseExpireDate
              },
              droneTypes: aDroneTypes
          }
        }).save((err, personnel) => {
          if (err)
            return console.log(err);
        });
      });
    });
  },
  
  insert2: (aIdTelegram, aName, aSurname, aCf, aCountry, aCity, aAddress, aAirOperatorName, aBaseName, aRoles = [], aMissions = [], aLocPermission = false,
				aLicenseId = undefined, aLicenseType = undefined, aLicenseExpireDate = undefined, aDroneTypes = undefined) => {
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
	  airOperator: AirOperator.findByNameSync(aAirOperatorName, '_id')._id,
	  base: Base.findByNameSync(aBaseName, '_id')._id,
	  roles: aRoles,
	  missions: aMissions,
	  locPermission: aLocPermission,
	  pilotInfo: {
		  license: {
			  id: aLicenseId,
			  type: aLicenseType,
			  expiring: aLicenseExpireDate
		  },
		  droneTypes: aDroneTypes
	  }
	}).save((err, personnel) => {
	  if (err)
		return console.log(err);
	  // Se la persona inserita ha un ruolo pilota, manutentore o equipaggio devo aggiornare la base in cui lavora
	  if (personnel.roles.includes('pilot'))
		Base.updateById(personnel.base, {$push: {'staff.pilots': personnel._id}});
	  if (personnel.roles.includes('equip'))
		Base.updateById(personnel.base, {$push: {'staff.equip': personnel._id}});
	  if (personnel.roles.includes('mainteiner'))
		Base.updateById(personnel.base, {$push: {'staff.mainteiners': personnel._id}});
	  // Se la persona inserita ha un ruolo di comando devo aggiornare la base e/o l'operatore aereo corrispondente
	  if (personnel.roles.includes('AM'))
		AirOperator.updateById(personnel.airOperator, {'roles.AM': personnel._id});
	  if (personnel.roles.includes('CQM'))
		AirOperator.updateById(personnel.airOperator, {'roles.CQM': personnel._id});
	  if (personnel.roles.includes('SM'))
		AirOperator.updateById(personnel.airOperator, {'roles.SM': personnel._id});
	  if (personnel.roles.includes('ViceAM'))
		Base.updateById(personnel.base, {'roles.ViceAM': personnel._id});
	  if (personnel.roles.includes('BaseSupervisor'))
		Base.updateById(personnel.base, {'roles.BaseSupervisor': personnel._id});
	});
  },
  
  updateByCf: (aCf, newValues) => {
    models.Personnel.updateOne({cf: aCf}, newValues, (err) => {});
  },

  updateById: (aId, newValues) => {
    models.Personnel.updateOne({_id: id}, newValues, (err) => {});
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
  insert: (aNumber, aType, aAirOperatorName, aBaseName, aState, aLastMaint = undefined, aNotes = undefined, aMissions = []) => {
	new models.Drone({
	  _id: mongoose.Types.ObjectId(),
	  number: aNumber,
	  type: aType,
	  airOperator: AirOperator.findByNameSync(aAirOperatorName, '_id')._id,
	  base: Base.findByNameSync(aBaseName, '_id')._id,
	  state: {
	    generalState: aState,
		lastMaintenance: aLastMaint,
		notes: aNotes
	  },
	  missions: aMissions
	}).save((err, drone) => {
	  if (err)
	    return console.log(err);
	  // Il drone deve essere aggiunto alla lista di droni della base corrispondente
	  Base.updateById(drone.base, {$push: {drones: drone._id}});
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
  insert: (aDate, aType, aBase, aDescription, aFlightPlan) => {
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
      flightPlan: aFlightPlan
      /*drones: Inseriti successivamente */
      /*pilots: Inseriti successivamente */
      /*equip: Inseriti successivamente */
      /*mainteiners: Inseriti successivamente se la missione ha durata maggiore di 3h */
    }).save((err, mission) => {
      if (err)
        return console.log(err);
      
      // Inserisco una pendingMission al supervisore della base che l'ha richiesta, 
      // in questo modo potrà selezionare in un momento successivo personale e droni
      Personnel.updateById(mission.supervisor, {$push: {pendingMissions: mission._id}});
      // Dovrebbe essere reso comprensibile se una pendingMission in Personnel sia 
      // di un supervisore che deve finire di definire squadra e droni o
      // di un pilota che ancora non ha inserito il Logbook

    });
  },

  addPilot: (aMissionId, aPilotId) => {
    Mission.updateById(aMissionId, {$push: {pilots: aPilotId}});
    // Aggiungo la missione alle pendingMissions del pilota
    Personnel.updateById(aPilotId, {$push: {pendingMissions: aMissionId}});
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

