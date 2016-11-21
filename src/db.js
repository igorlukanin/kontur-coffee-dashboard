const config = require('config');
const r = require('rethinkdb');

const connection = r.connect({
    host: config.get('rethinkdb.host'),
    port: config.get('rethinkdb.port'),
    db: config.get('rethinkdb.db')
});


const getSales = () => connection.then(c =>
    r.table('sales')
        .pluck('client_personnel_number', 'sum', 'datetime')
        .run(c)
        .then(cursor => cursor.toArray()));

const getOfficeSales = () => connection.then(c =>
    r.table('sales')
        .filter(r.row('client_personnel_number').eq('').not())
        .eqJoin(r.row('client_personnel_number'), r.table('users'), { index: 'employeeCode' })
        .map(function(data) {
            return data.merge({
                office: data('right')('officeItem')('town').add(', ').add(data('right')('officeItem')('title')),
                name: data('right')('firstname').add(' ').add(data('right')('surname')),
                login: data('right')('login'),
                datetime: data('left')('datetime'),
            })
        })
        .filter(r.row('office').eq('Екатеринбург, Малопрудная 5'))
        .pluck('name', 'login', 'datetime')
        .run(c)
        .then(cursor => cursor.toArray()));

const getOfficeWorkersCount = () => connection.then(c =>
    r.table('users')
        .filter(r.row.hasFields('officeItem'))
        .map(function(data) {
            return data.merge({
                office: data('officeItem')('town').add(', ').add(data('officeItem')('title'))
            });
        })
        .filter(r.row('office').eq('Екатеринбург, Малопрудная 5'))
        .count()
        .run(c));


module.exports = {
    getSales,
    getOfficeSales,
    getOfficeWorkersCount
};