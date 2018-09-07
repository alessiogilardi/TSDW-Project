const mongoose = require('mongoose');
const models = require('./models.js');

exports.createAirOperator = (oName, oCountry, oCity, oAddress, oAM = null, oCQM = null, oSM = null, oBases = []) => {
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
}

exports.updateAirOperatorByName = (oName, newValues) => {
  
  models.AirOperator.findOneAndUpdate({name: "oName"}, {name: "aaa"}, (err) => {
    if(err) console.log(err);
  });
  
  /*
  models.AirOperator.update({_id: mongoose.Types.ObjectId('5b92416ba3d7620a1422ef03')}, { $set: JSON.parse('{"location": {"city": "Genoa"}}')}, (err, user) => {
    if(err) console.log(err);
  });
  */
}