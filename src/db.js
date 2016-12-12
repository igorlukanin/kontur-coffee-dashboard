const config = require('config');
const r = require('rethinkdb');

const connection = r.connect({
    host: config.get('rethinkdb.host'),
    port: config.get('rethinkdb.port'),
    db: config.get('rethinkdb.db')
});


const getSales = () => connection.then(c => r.table('sales')
    .pluck('client_personnel_number', 'sum', 'datetime')
    .run(c)
    .then(cursor => cursor.toArray()));

const getOfficeSales = () => connection.then(c => r.table('sales')
    .filter(r.row('client_personnel_number').eq('').not())
    .eqJoin(r.row('client_personnel_number'), r.table('users'), { index: 'employeeCode' })
    .map(function(data) {
        return data.merge({
            office: data('right')('officeItem')('town').add(', ').add(data('right')('officeItem')('title')),
            name: data('right')('firstname').add(' ').add(data('right')('surname')),
            login: data('right')('login'),
            datetime: data('left')('datetime'),
            room: r.branch(
                data('right').hasFields({ location: ['zoneName'] }),
                data('right')('location')('zoneName').split(' ').nth(0),
                r.branch(
                    r.and(
                        data('right').hasFields({ location: ['roomTitle'] }),
                        data('right')('location')('roomTitle').eq('').not()),
                    data('right')('location')('roomTitle').split(' ').nth(0),
                    data('right')('room').split(' ').nth(0))),
        })
    })
    .filter(r.row('office').eq('Екатеринбург, Малопрудная 5'))
    .pluck('name', 'login', 'datetime', 'room')
    .run(c)
    .then(cursor => cursor.toArray()));

const getOfficeRooms = () => connection.then(c => r.table('users')
    .filter(r.or(
        r.row.hasFields('room'),
        r.row.hasFields('location')))
    .map(function(data) {
        return data.merge({
            office: data('officeItem')('town').add(', ').add(data('officeItem')('title')),
            room: r.branch(
                data.hasFields({ location: ['zoneName'] }),
                data('location')('zoneName').split(' ').nth(0),
                r.branch(
                    r.and(
                        data.hasFields({ location: ['roomTitle'] }),
                        data('location')('roomTitle').eq('').not()),
                    data('location')('roomTitle').split(' ').nth(0),
                    data('room').split(' ').nth(0))),
        })
    })
    .filter(r.row('office').eq('Екатеринбург, Малопрудная 5'))
    .filter(r.row('room').eq('').not())
    .group(r.row('room'))
    .count()
    .run(c)
    .then(cursor => cursor.toArray()));

const getOfficeWorkersCount = () => connection.then(c => r.table('users')
    .filter(r.row.hasFields('officeItem'))
    .map(function(data) {
        return data.merge({
            office: data('officeItem')('town').add(', ').add(data('officeItem')('title'))
        });
    })
    .filter(r.row('office').eq('Екатеринбург, Малопрудная 5'))
    .count()
    .run(c));

const getLastSaleDate = () => connection.then(c => r.table('sales')
    .orderBy({ index: r.desc('datetime') })
    .limit(1)
    .map(r.row('datetime'))
    .nth(0)
    .run(c));

const getLastUserDate = () => connection.then(c => r.table('users')
    .orderBy({ index: r.desc('syncDate') })
    .limit(1)
    .map(r.row('syncDate'))
    .nth(0)
    .run(c));

const upsertUser = user => connection.then(c => r.table('users')
    .insert(user, { conflict: 'update' })
    .run(c));

const upsertSales = sales => connection.then(c => r.table('sales')
    .insert(sales, { conflict: 'update' })
    .run(c));


module.exports = {
    getSales,
    getOfficeSales,
    getOfficeRooms,
    getOfficeWorkersCount,
    getLastSaleDate,
    getLastUserDate,
    saveUser: upsertUser,
    saveSales: upsertSales
};
