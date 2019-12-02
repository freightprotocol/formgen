const express = require('express');
const jsonUtils = require('../assets/scripts/json-utils');
const queueService = require('../service-modules/bol-invoice-queue-service');
const exporter = require('../service-modules/pdf-generator');

const helpers = require('../hbs-helpers');

const testData = require('../assets/bol-invoice-mock-data.json');

const router = express.Router();
const baseUrl = "http://localhost:3000";

const logger = require('../logger');

logger.info('Invoice Route Loaded');

router.get('/view-test', (req, res) => {
    logger.debug(`GET:/bol-invoice/view-test`);
    res.render('bol-invoice', {
        title: 'Shipment Invoice',
        clientData: jsonUtils.encodeJSON(testData),
        data: testData
    });
});

router.get('/:id', (req, res) => {
    logger.debug(`POST:/bol-invoice/${req.params.id}`);
    let postData = queueService.getDataById(req.params.id);
    console.log(JSON.stringify(postData));
    res.render('bol-invoice', {
        title: 'Shipment Invoice',
        clientData: jsonUtils.encodeJSON(postData),
        data: postData
    });
});

router.post('/sendTestData', (req, res) => {
    logger.debug(`POST:/bol-invoice/sendTestData`);
    res.send(queueService.addItem(req.body));
});

router.post('/', (req, res) => {
    logger.info(`POST:/bol-invoice`);
    logger.debug(`${req.body}`);
    let data = req.body;

    data.Total = data.Total || data.Subtotal + data.Tax;
    data.Discount = data.discount || 0;

    let id = queueService.addItem(data);

    const jobOptions = {
        inMemory: true 
    };

    const options = {
        pageSize : "A4",
        printSelectionOnly: false,
        landscape: false,
        printBackground: true
    }

    exporter.createJob("http://localhost:3000/bol-invoice/" + id, `./invoice.pdf`, options, jobOptions)
        .then(job => {
            job.on('job-complete', (r) => {
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-disposition': `attachment;filename=invoice.pdf`,
                    'Content-Length': r.results[0].length
                });
                res.end(r.results[0]);
                queueService.removeById(id);
            });
            job.on('error', console.error);
            job.render();
        }).catch(logger.error);
});

module.exports = router;