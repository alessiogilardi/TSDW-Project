const models    = require('./models.js');
const queries   = require('./queries.js');

const operations = {
    INSERT: 'insert',
    DELETE: 'delete',
    UPDATE: 'update'
}

models.AirOperator.watch()
.on('change', data => {
    console.log(data);
});

models.Base.watch()
.on('change', data => {
    console.log(data);
});