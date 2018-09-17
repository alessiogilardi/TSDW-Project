require('dotenv').config();
const mongoose = require('mongoose');

var dbAddress   = process.env.DB_ADDRESS || 'localhost'; 
var dbPort      = process.env.DB_PORT || '27017';
var dbName      = process.env.DB_NAME || 'TSDW';

exports.connect = () => {
    mongoose.connect('mongodb://' + dbAddress + ':' + dbPort + '/' + dbName, {useNewUrlParser: true});
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        console.log('Mongoose connection started');
        process.on('SIGINT', () => {
            mongoose.disconnect(() => {
                console.log('Closing Mongoose connection');
                process.exit(0);
            });
        });
    });
    return mongoose;  
}

exports.disconnect = (time = 1500) => {
    setTimeout(() => {
        mongoose.disconnect();
    }, time);
}
