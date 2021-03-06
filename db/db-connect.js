/**
 * Modulo che gestisce la connessione al db.
 * Connect -> esegue connessione al DB e ritona una Promise
 * Disconnect -> esegue disconnessione dal DB e ritorna una Promise
 */

const mongoose = require('mongoose');

/**
 * Funzione che esegue la connessione al DB
 * 
 * @param {String} dbAddress Indirizzo IP del DB
 * @param {String} dbPort    Porta a cui connettersi
 * @param {String} dbName    Node del DB
 * 
 * @returns {Promise}
 */
const connect = async (dbAddress, dbPort, dbName) => {
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'))
    mongoose.connection.once('open', () => {
        console.log('Mongoose connection started')
        process.on('SIGINT', () => {
            disconnect()
            .then(() => process.exit(0))
        })
    })
    mongoose.set('useCreateIndex', true)
    return mongoose.connect(`mongodb://${dbAddress}:${dbPort}/${dbName}`, { useNewUrlParser: true })
}

/**
 * Funzione che esegue la disconnessione dal DB
 * 
 * @returns {Promise}
 */
const disconnect = () => {
    console.log('Closing Mongoose connection')
    return mongoose.disconnect()
}

exports.connect    = connect
exports.disconnect = disconnect