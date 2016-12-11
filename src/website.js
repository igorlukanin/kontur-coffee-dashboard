const compression = require('compression');
const config = require('config');
const ect = require('ect');
const express = require('express');
const multer  = require('multer');
const Promise = require('bluebird');

const data = require('./data');
const loader = require('./loader');

const dataPath = config.get('data.path');
const dataFileName = config.get('data.sales_xlsx_name');
const port = config.get('website.port');

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, dataPath),
        filename: (req, file, cb) => cb(null, dataFileName)
    })
});


express()
    .use(compression())
    .use('/', express.static('static'))

    .use('/js/d3.js', express.static('node_modules/d3/build/d3.min.js'))
    .use('/js/moment.js', express.static('node_modules/moment/min/moment.min.js'))

    .get('/', (req, res) => res.render('index'))

    .get('/data.json', (req, res) => data.compute()
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

    .post('/', upload.single('file'), (req, res) => {
        return req.file
            ? loader.loadSalesFile()
                .then(() => res.json({ success: true }))
                .catch(e => {
                    console.log(e);
                    return res.json({ error: 'Failed to load sales' });
                })
            : res.json({ error: 'Failed to upload file' });
    })

    .set('view engine', 'ect')
    .engine('ect', ect({
        watch: true,
        root: __dirname + '/../views'
    }).render)
    .listen(port, () => console.info('Website started at port ' + port));