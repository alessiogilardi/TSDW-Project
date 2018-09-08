const mongoose = require('mongoose');
const models = require('./models.js');

/* Rinominare le funzioni create in insert */
exports.AirOperator = {

  create: (oName, oCountry, oCity, oAddress, oAM = undefined, oCQM = undefined, oSM = undefined, oBases = []) => {
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

  create2: (airOperator) => {
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
  }
};

exports.Base = {
	
  create: (oName, oAirOperator, oCountry, oCity, oLatitude = undefined, oLongitude = undefined, oViceAM = undefined, oBaseSupervisor = undefined, oPilots = undefined, \
		   oEquip = undefined, oMain, oMainteiners = undefined, oDrones = []) => {
	new models.Base({
		_id: new mongoose.Types.ObjectId(),
		name: oName,
		airOperator: oAirOperator,
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
	}).save((err, results) => {
		// results contiene il documento json della base appena creata
		if (err)
          return console.log(err);
		// Quando la query viene eseguita, devo aggiungere l'id della base appena creata alla lista di basi dell'operatore aereo corrispondente
		var edited = {$push: {'bases': results._id}};
		AirOperator.updateByName(results.airOperator, edited);
	});
  },
  
  updateByName: () => {
	models.Base.updateOne({name: oName}, newValues, (err) => {
		if (err)
			console.log(err);
    });
  }
};

exports.Personnel = {
	
  create: () => {

  },
  
  updateByName: () => {

  }
};