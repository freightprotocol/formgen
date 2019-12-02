const express = require('express');
const jsonUtils = require('../assets/scripts/json-utils');
const queueService = require('../service-modules/load-confirmation-queue-service');
const exporter = require('../service-modules/pdf-generator');

const mockData = require('../assets/load-confirmation-mock-data.json');

const router = express.Router();

const logger = require('../logger');

logger.info('Load Confirmation Route Loaded');

router.get('/test', (req, res) => {
    logger.debug(`GET:/load-confirmation/test`);
    res.send({status: 200, message: "success"});
});

router.get('/view-test', (req, res) => {
    logger.debug(`GET:/load-confirmation/view-test`);
    res.render('load-confirmation', {
        title: 'load-confirmation',
        clientData: jsonUtils.encodeJSON(mockData),
        data: mockData
    });
});

router.post('/view', (req, res) => {
    logger.debug(`POST:/load-confirmation/view`);
    let id = queueService.addItem(req.body);
    res.send(queueService.data[0].id);
});

router.post('/sendTestData', (req, res) => {
    logger.debug(`POST:/load-confirmation/sendTestData`);
    res.send(queueService.addItem(req.body));
});

router.post('/', (req, res) => {
    logger.info(`POST:/load-confirmation`);
    logger.debug(req.body);
    let id = queueService.addItem(req.body);
    const jobOptions = {
        inMemory: true 
    };
    const options = {
        pageSize : "A4",
        printSelectionOnly: false,
        landscape: false,
        margin: 0,
        printBackground: true
    }
    exporter.createJob("http://localhost:3000/load-confirmation/" + id, `./load-confirmation-$.pdf`, options, jobOptions)
        .then(job => {
            job.on('job-complete', (r) => {
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-disposition': `attachment;filename=load-confirmation-$.pdf`,
                    'Content-Length': r.results[0].length
                });
                res.end(r.results[0]);
                queueService.removeById(id);
            });
            job.render();
        }).catch(logger.error);
});

router.get('/:id', (req, res) => {
    logger.debug(`GET:/load-confirmation/${req.params.id}`);
    let postData = queueService.getDataById(req.params.id);
    
    res.render('load-confirmation', {
        title: 'load-confirmation',
        clientData: jsonUtils.encodeJSON(postData),
        data: postData
    });
});

module.exports = router;