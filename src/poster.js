const config = require('config');
const Promise = require('bluebird');
const request = require('request');
const moment = require('moment');

const id = config.get('poster.client_id');
const secret = config.get('poster.client_secret');
const startDate = config.get('poster.start_date');

const requestData = (method, options) => new Promise((resolve, reject) => {
    let qs = {
        format: 'json',
        token: secret
    };

    if (options !== undefined) {
        Object.keys(options).forEach(key => {
            qs[key] = options[key];
        });
    }

    request({
        url: 'https://' + id + '.joinposter.com/api/' + method,
        qs: qs
    }, (err, res, body) => {
        try {
            resolve(JSON.parse(body).response);
        }
        catch (e) {
            reject(e);
        }
    });
});

const getTransactions = () => requestData('dash.getTransactions', {
    status: 0, // Все транзакции: открытые, закрытые, удалённые
    dateFrom: moment(startDate).format("YYYYMMDD") // С определённой даты
});


module.exports = {
    getTransactions
};