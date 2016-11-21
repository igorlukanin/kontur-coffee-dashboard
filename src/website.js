const compression = require('compression');
const config = require('config');
const ect = require('ect');
const express = require('express');
const Promise = require('bluebird');

const data = require('./data');

const port = config.get('website.port');


express()
    .use(compression())
    .use('/', express.static('static'))

    .use('/js/d3.js', express.static('node_modules/d3/build/d3.min.js'))
    .use('/js/moment.js', express.static('node_modules/moment/min/moment.min.js'))

    .get('/', (req, res) => res.render('index'))

    .get('/data.json', (req, res) => data.compute()
        .then(data => res.json(data))
        .catch(err => console.log(err)))

    .set('view engine', 'ect')
    .engine('ect', ect({
        watch: true,
        root: __dirname + '/../views'
    }).render)
    .listen(port, () => console.info('Website started at port ' + port));