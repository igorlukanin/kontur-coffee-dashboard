const config = require('config');
const r = require('rethinkdb');

const connection = r.connect({
    host: config.get('rethinkdb.host'),
    port: config.get('rethinkdb.port'),
    db: config.get('rethinkdb.db')
});


const getSales = () => connection.then(c =>
    r.table('sales')
        .pluck('client_personnel_number', 'datetime')
        .run(c)
        .then(cursor => cursor.toArray()));


module.exports = {
    getSales
};