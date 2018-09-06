var  mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var operatoreAereoSchema = new mongoose.Schema({
  _id: ObjectId,
  name: String,
  location: {
    country: String,
    city: String,
    address: String
  },
  roles: {
    AM: {type: ObjectId, default: null},
    CQM: {type: ObjectId, default: null},
    SM: {type: ObjectId, default: null}
  },
  bases: [{type: ObjectId, default: null}]
});

exports.newOperatore = (mName, mCountry, mCity, mAddress) => {
    var Operatore = mongoose.model('Operator', operatoreAereoSchema);
    var instance = new Operatore({
        _id: new mongoose.Types.ObjectId(),
        name: mName,
        location: {
            country: mCountry,
            city: mCity,
            address: mAddress
        }
    });
    instance.save((err) => {
        if (err)
            return console.log(err);
    });
}