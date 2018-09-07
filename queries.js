const mongoose = require('mongoose');
const models = require('./models.js');

exports.AirOperator = {

  create: (oName, oCountry, oCity, oAddress, oAM = undefined, oCQM = undefined, oSM = undefined, oBases = undefined) => {
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

  updateByName: (oName, newValues) => {
    models.AirOperator.updateOne({name: oName}, newValues, () => {});
  }
};

exports.Base = {
  create: () => {

  },
  updateByName: () => {

  }
}

exports.Personnel = {
  create: () => {

  },
  updateByName: () => {

  }
}