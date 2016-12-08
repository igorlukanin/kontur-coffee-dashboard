const config = require('config');
const Promise = require('bluebird');
const request = require('request');

const id = config.get('staff.client_id');
const secret = config.get('staff.client_secret');
const username = config.get('staff.username');
const password = config.get('staff.password');


let token;

const getAuthToken = () => new Promise(resolve => {
    if (token) {
        resolve(token);
    }
    else {
        request.post({
            url: 'https://' + id + ':' + secret + '@passport.skbkontur.ru/authz/staff/oauth/token',
            headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
            body: 'grant_type=password&scope=profiles&username=' + username + '&password=' + password
        }, (err, res, body) => {
            token = JSON.parse(body).access_token;
            resolve(token);
        });
    }
});

const requestData = uri => getAuthToken()
    .then(token => new Promise((resolve, reject) => {
        request({
            url: 'https://staff.skbkontur.ru' + uri,
            headers: { 'Authorization': 'Bearer ' + token }
        }, (err, res, body) => {
            try {
                resolve(JSON.parse(body));
            }
            catch (e) {
                reject(e);
            }
        });
    }));

const requestUsers = () => requestData('/api/users');

const requestUser = sid => requestData('/api/users/' + sid);


module.exports = {
    users: requestUsers,
    user: requestUser
};