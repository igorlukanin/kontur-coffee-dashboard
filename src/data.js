const _ = require('lodash');
const moment = require('moment');

const db = require('./db');


const getSalesAndGuests = () => db.getSales().then(sales => {
    const allSales = sales.map(sale => {
        sale.sum = +sale.sum;
        sale.week = moment(sale.datetime).week();
        sale.anonymous = sale.client_personnel_number === '';

        return sale;
    });

    const groupedSales = _.groupBy(allSales, 'anonymous');
    const knownUsersSales = groupedSales[false];
    const anonymousSales = groupedSales[true];

    const data = {
        sales: _.countBy(allSales, 'week'),
        anonymousSales: _.countBy(anonymousSales, 'week'),
        users: _.groupBy(knownUsersSales, 'week'),
        arps: _.groupBy(allSales, 'week'),
        arpg: _.groupBy(knownUsersSales, 'week')
    };

    for (let i in data.users) { if (data.users.hasOwnProperty(i)) {
        data.users[i] = _.uniqBy(data.users[i], 'client_personnel_number').length;
    }}

    for (let i in data.arps) { if (data.arps.hasOwnProperty(i)) {
        data.arps[i] = Math.round(_.sumBy(data.arps[i], 'sum') / data.sales[i]);
    }}

    for (let i in data.arpg) { if (data.arpg.hasOwnProperty(i)) {
        data.arpg[i] = Math.round(_.sumBy(data.arpg[i], 'sum') / data.users[i]);
    }}

    const weeks = _.chain(data.sales).keys();
    const weeklySales = _.chain(data.sales).values();
    const weeklyUsers = _.chain(data.users).values();
    const weeklyArps = _.chain(data.arps).values();
    const weeklyArpg = _.chain(data.arpg).values();

    return _.merge(data, {
        weeks: weeks.values(),
        min: {
            week: weeks.first(),
            sales: weeklySales.min(),
            users: weeklyUsers.min(),
            arps: weeklyArps.min(),
            arpg: weeklyArpg.min()
        },
        max: {
            week: weeks.last(),
            sales: weeklySales.max(),
            users: weeklyUsers.max(),
            arps: weeklyArps.max(),
            arpg: weeklyArpg.max()
        }
    });
});


module.exports = {
    getSalesAndGuests
};