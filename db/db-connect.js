/**
 * Modulo che esegue la connessione al db.
 * Connect -> esegue connessione
 * Disconnect -> esegue disconnessione
 */

require('dotenv').config();
const mongoose = require('mongoose');

var dbAddress   = process.env.DB_ADDRESS || 'localhost'; 
var dbPort      = process.env.DB_PORT || '27017';
var dbName      = process.env.DB_NAME || 'TSDW';

/**
 * Funzione che esegue la connessione al db MongoDB e restituisce un oggetto Mongoose
 */
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

/**
 * Funzione che esegue la disconnessione dal db MongoDB dopo un intervallod di tempo prestabilito,
 * in modo da consentire che eventuali operazioni ancora pendenti terminino.
 */
exports.disconnect = (time = 1500) => {
    setTimeout(() => {
        mongoose.disconnect();
    }, time);
}
