const models    = require('./models.js');
const db        = require('./db-connect.js');
const queries   = require('./queries.js');

var mongoose = db.connect();

//queries.AirOperator.insert('eurodrone', 'Italy', 'Genoa', 'Corso Europa 22');

//queries.Base.insert2("Base 4", 'eurodrone' , "Italy", "La Speza", "22", "22");

queries.Personnel.insert('42', 'Alessio', 'Bollea', 'ilmiocf', 'Italy', 'Genoa', 'nonvelodico', 'eurodrone', 'Base 4', ['pilot','maintainer'], 'AM', ['ViceAM'], false, 'licId123', 'SuperLicenseType', 5, new Date(), 'LM');
//aIdTelegram, aName, aSurname, aCf, aCountry, aCity, aAddress, aAirOperatorName, aBaseName, aOccupation, aAirOperatorRole = undefined, aBaseRole = undefined, aLocPermission = false, aLicenseId = undefined, aLicenseType = undefined, aLicenseMaxMissionRank = undefined, aLicenseExpireDate = undefined, aDroneTypes = undefined
//queries.Drone.insert('1lm10dr0n3', 'Heavy', 'eurodrone', 'Base 4', 'Ready');

