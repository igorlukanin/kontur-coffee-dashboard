const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');

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
            week: weeks.first()
        },
        max: {
            week: weeks.last(),
            sales: weeklySales.max(),
            arpg: weeklyArpg.max()
        }
    });
});

const getPenetrationAndAcquisition = () => Promise.all([
    db.getOfficeWorkersCount(),
    db.getOfficeSales()
]).then(result => {
    const officeWorkersCount = result[0];

    const knownUsersSales = result[1].map(sale => {
        sale.week = moment(sale.datetime).week();
        return sale;
    });

    const groups = _.groupBy(knownUsersSales, 'week');

    const data = {
        penetration: groups,
        acquisition: {},
        acquiredGuests: {}
    };

    let allUserNames = [];

    for (let i in data.penetration) { if (data.penetration.hasOwnProperty(i)) {
        const userNames = data.penetration[i].map(user => user.login);
        const beforeCount = allUserNames.length;
        allUserNames = _.union(allUserNames, userNames);
        const afterCount = allUserNames.length;

        data.penetration[i] = Math.round(allUserNames.length / officeWorkersCount * 100);
        data.acquiredGuests[i] = afterCount - beforeCount;
        data.acquisition[i] = Math.round(data.acquiredGuests[i] / officeWorkersCount * 100);
    }}

    const weeklyPenetration = _.chain(data.penetration).values();
    const weeklyAcquisition = _.chain(data.acquisition).values();

    return _.merge(data, {
        max: {
            penetration: weeklyPenetration.max()
        },
        officeWorkersCount
    });
});

const compute = () => Promise.all([ getSalesAndGuests(), getPenetrationAndAcquisition() ])
    .then(result => _.merge(result[0], result[1]));


module.exports = {
    compute
};