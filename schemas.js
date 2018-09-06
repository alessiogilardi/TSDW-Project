var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var airOperatorSchema = new mongoose.Schema({
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

var personnelSchema = new mongoose.Schema({
    _id: ObjectId,
    idTelegram: String,
    name: String,
    surname: String,
    cf: String,
    location: {
        country: String,
        city: String,
        address: String
    },
    airOperator: ObjectId,
    base: ObjectId,
    roles: [String],
    missions: [ObjectId],
    locPermission: Boolean,
    pilotInfo: {
        license: {
            id: String,
            type: String,
            expiring: Date
        },
        droneTypes: [String]
    }
});

exports.newOperator = (mName, mCountry, mCity, mAddress) => {
    var Operator = mongoose.model('Operator', airOperatorSchema);
    var instance = new Operator({
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