const _ = require('lodash');
const moment = require('moment');

const db = require('./db');


const getSalesAndGuests = () => db.getSales().then(sales => {
    const allSales = sales.map(sale => {
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
    };

    for (let i in data.users) { if (data.users.hasOwnProperty(i)) {
        data.users[i] = _.uniqBy(data.users[i], 'client_personnel_number').length;
    }}

    const weeks = _.chain(data.sales).keys();
    const weeklySales = _.chain(data.sales).values();
    const weeklyUsers = _.chain(data.users).values();

    return _.merge(data, {
        weeks: weeks.values(),
        min: {
            week: weeks.first(),
            sales: weeklySales.min(),
            users: weeklyUsers.min()
        },
        max: {
            week: weeks.last(),
            sales: weeklySales.max(),
            users: weeklyUsers.max()
        }
    });
});


module.exports = {
    getSalesAndGuests
};