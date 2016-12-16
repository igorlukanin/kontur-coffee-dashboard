const compression = require('compression');
const config = require('config');
const ect = require('ect');
const express = require('express');
const Promise = require('bluebird');

const data = require('./data');

const port = config.get('website.port');
const dataCacheIntervalMs = config.get('website.data_cache_interval_ms');


let cachedData = data.compute();
let cacheUpdateDate = new Date();

const getData = () => new Promise(resolve => {
    resolve(cachedData);

    if (new Date().getTime() - cacheUpdateDate.getTime() > dataCacheIntervalMs) {
        data.compute().then(data => {
            cachedData = Promise.resolve(data);
        });
    }
});


express()
    .use(compression())
    .use('/', express.static('static'))

    .use('/js/d3.js', express.static('node_modules/d3/build/d3.min.js'))
    .use('/js/moment.js', express.static('node_modules/moment/min/moment.min.js'))

    .get('/', (req, res) => res.render('index'))

    .get('/data.json', (req, res) => getData()
        .then(data => res.json(data))
        .catch(err => console.log(err)))

    .get('/status.json', (req, res) => data.getStatus()
        .then(data => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data, null, 2));
        })
        .catch(err => console.log(err)))

    .get('/guests.json', (req, res) => data.getNewGuestsByWeek()
        .then(data => {
            const weeks = Object.keys(data);
            const lastWeek = weeks[weeks.length - 1];

            const selectedData = {};
            selectedData[lastWeek] = data[lastWeek];

            if (data[lastWeek - 1] !== undefined) {
                selectedData[lastWeek - 1] = data[lastWeek - 1];
            }

            res.setHeader('Content-Type', 'application/json');
            return res.send(JSON.stringify(selectedData, null, 2));
        })
        .catch(err => console.log(err)))

    .set('view engine', 'ect')
    .engine('ect', ect({
        watch: true,
        root: __dirname + '/../views'
    }).render)
    .listen(port, () => console.info('Website started at port ' + port));