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
        penetration: {},
        acquisition: {},
        acquiredGuests: {},
        retention: {},
        churn: {}
    };

    let allUserNames = [];

    for (let i in groups) { if (groups.hasOwnProperty(i)) {
        const userNames = _.uniq(groups[i].map(user => user.login));

        const beforeCount = allUserNames.length;
        allUserNames = _.union(allUserNames, userNames);
        const afterCount = allUserNames.length;

        data.penetration[i] = Math.round(allUserNames.length / officeWorkersCount * 100);
        data.acquiredGuests[i] = afterCount - beforeCount;
        data.acquisition[i] = Math.round(data.acquiredGuests[i] / officeWorkersCount * 100);

        data.retention[i] = Math.round((userNames.length - data.acquiredGuests[i]) / beforeCount * 100);
        data.churn[i] = Math.round((beforeCount - (userNames.length - data.acquiredGuests[i])) / beforeCount * 100);
    }}

    const weeklyPenetration = _.chain(data.penetration).values();
    const weeklyRetention = _.chain(data.retention).values();
    const weeklyChurn = _.chain(data.churn).values();

    return _.merge(data, {
        max: {
            penetration: weeklyPenetration.max(),
            retention: weeklyRetention.max(),
            churn: weeklyChurn.max()
        },
        officeWorkersCount
    });
});

const compute = () => Promise.all([ getSalesAndGuests(), getPenetrationAndAcquisition() ])
    .then(result => _.merge(result[0], result[1]));

const getNewGuestsByWeek = () => db.getOfficeSales().then(sales => {
    const knownUsersSales = sales.map(sale => {
        sale.week = moment(sale.datetime).week();
        return sale;
    });

    const groups = _.groupBy(knownUsersSales, 'week');

    let allUserNames = [];

    for (let i in groups) { if (groups.hasOwnProperty(i)) {
        groups[i] = _.uniq(groups[i].map(sale => sale.login.replace('kontur\\', '')));
        groups[i] = _.without(groups[i], ...allUserNames).sort();
        allUserNames = _.union(allUserNames, groups[i]);
    }}

    return groups;
});


module.exports = {
    compute,
    getNewGuestsByWeek
};