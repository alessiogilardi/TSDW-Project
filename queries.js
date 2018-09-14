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

  updateByName: (oName, newValues) => {
    models.AirOperator.updateOne({name: oName}, newValues, (err) => {
      if (err)
        return console.log(err);
    });
  },

  updateById: (id, newValues) => {
    models.AirOperator.updateOne({_id: id}, newValues, (err) => {
      if (err)
        return console.log(err);
    });
  },
  
  findByName: (name, projection, callback) => {
    models.AirOperator.findOne()
    .where('name').equals(name)
    .select(projection)
    .exec((err, doc) => {
      callback(doc);
    });
  },

  // La funzione esterna (findByName) è sincrona, ma la funzione di callback è asincrona. Il valore di ritorno (doc) è conosciuto solo dalla funzione di callback.
  // Dovrei quindi ritornare il valore dalla funzione di callback, ma non posso perché è asincrona.

  findByNameSync: (name, projection) => {
    var ret = null;
    models.AirOperator.findOne()
    .where('name').equals(name)
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
    AirOperator.findByName(oAirOperator, '_id', (doc) => {

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
      }).save((err, result) => {
      // results contiene il documento json della base appena creata
        if (err)
          return console.log(err);
        // Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
        //var edited = {$push: {'bases': result._id}};
        AirOperator.updateById(result.airOperator, {$push: {'bases': result._id}});
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
  	}).save((err, result) => {
    	// results contiene il documento json della base appena creata
        if (err)
          return console.log(err);
        // Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
        //var edited = {$push: {'bases': result._id}};
        AirOperator.updateById(result.airOperator, {$push: {'bases': result._id}});
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
}