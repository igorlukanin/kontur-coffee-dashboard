const config = require('config');
const Promise = require('bluebird');

const db = require('./db');
const poster = require('./poster');


const loadSales = () => poster.getTransactions()
    .then(ts => ts.map(tx => ({
        id: tx.transaction_id,
        datetime: new Date(+tx.date_close),
        client_personnel_number: +tx.client_firstname ? '' + +tx.client_firstname : '',
        client_surname: tx.client_lastname,
        client_card_number: tx.card_number,
        sum: tx.sum / 100,
        payment_by_cash: tx.payed_cash / 100,
        payment_by_card: tx.payed_card / 100,
        payment_by_certificate: tx.payed_cert / 100,
        payment_by_bonuses: tx.payed_bonus / 100,
        comment: tx.transaction_comment,
        status: tx.status
    })));


Promise.resolve(true)
    .then(loadSales)
    .then(db.saveSales)
    .then(() => setTimeout(process.exit, 3000));