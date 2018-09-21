const models    = require('./models.js');
const queries   = require('./queries.js');

const operations = {
    INSERT: 'insert',
    DELETE: 'delete',
    UPDATE: 'update'
}

models.Base.watch()
    .on('change', data => {
        if (data.operationType === operations.INSERT) {
            
        }
    });