const mongoose = require('mongoose');
const models = require('./models.js');
const deasync = require('deasync');

/* Rinominare le funzioni create in insert */
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
        console.log(err);
    });
  },

  updateById: (id, newValues) => {
    models.AirOperator.updateOne({_id: id}, newValues, (err) => {
      if (err)
        console.log(err);
    });
  },
  
  // La funzione esterna (findByName) è sincrona, ma la funzione di callback è asincrona. Il valore di ritorno (doc) è conosciuto solo dalla funzione di callback.
  // Dovrei quindi ritornare il valore dalla funzione di callback, ma non posso perché è asincrona.
  findByName: (oName, projection) => {
	var ret = null;
	models.AirOperator.findOne({name: oName}, projection, (err, doc) => {
		if (err)
			return console.log(err);
		ret = doc;
	});
	//BUSY WAITING!!!!!!
	while(ret == null)
		deasync.runLoopOnce();
	return ret;
  }
};

exports.Base = Base = {
	
  insert: (oName, oAirOperator, oCountry, oCity, oAddress, oLatitude = undefined, oLongitude = undefined, oViceAM = undefined, oBaseSupervisor = undefined, oPilots = undefined,
                oEquip = undefined, oMainteiners = undefined, oDrones = []) => {
	// Prima cerco l'id dell'operatore aereo conoscendone il nome (oAirOperator)
	airOp = AirOperator.findByName(oAirOperator, '_id');
	
  	new models.Base({
  		_id: new mongoose.Types.ObjectId(),
  		name: oName,
  		airOperator: airOp._id,
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
		var edited = {$push: {'bases': result._id}};
		AirOperator.updateById(result.airOperator, edited);
  	});
  },
  
  updateByName: () => {
	models.Base.updateOne({name: oName}, newValues, (err) => {
		if (err)
			console.log(err);
    });
  }
};

exports.Personnel = Personnel = {
	
  create: () => {

  },
  
  updateByName: () => {

  }
};