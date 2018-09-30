require('./db-connect').connect()
const queries = require('./queries')

queries.Personnel.find({name: 'Alessio'}, 'name surname telegramData', (err, aPerson) => console.log(aPerson))