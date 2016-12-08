const config = require('config');
const Promise = require('bluebird');

const db = require('./db');
const staff = require('./staff');

const delay = config.get('staff.delay_ms');


const crawlUsers = () => new Promise(resolve => {
    staff.users().then(users => {
        users.forEach((user, i) => {
            setTimeout((user, i) => {
                staff.user(user.sid).then(user => {
                    console.info('User ' + (1 + i) + ' / ' + users.length + ': ' + user.email);

                    db.saveUser(user);
                }).catch(err => {
                    console.error('User ' + (1 + i) + ' / ' + users.length + ': ' + err);
                });
            }, delay * i, user, i);
        });

        setTimeout(resolve, delay * users.length);
    });
});

Promise
    .resolve(true)
    .then(crawlUsers)
    .then(() => new Promise(resolve => {
        setTimeout(() => resolve(), 3000);
    }))
    .then(process.exit);
