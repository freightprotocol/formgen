const express = require('express');
const jsonUtils = require('../assets/scripts/json-utils');
const queueService = require('../service-modules/{name}-queue-service');
const exporter = require('../service-modules/pdf-generator');
const logger = require('../logger.js');

const router = express.Router();
logger.info(`{name} Route Loaded`);

router.get('/:id', (req, res) => {
    logger.debug(`GET:/{name}`);
    let postData = queueService.getDataById(req.params.id);
    
    res.render('{name}', {
        title: '{name}',
        clientData: jsonUtils.encodeJSON(postData),
        data: postData
    });
});

router.post('/view', (req, res) => {
    logger.debug(`POST:/{name}/view`);
    let id = queueService.addItem(req.body);
    res.send(queueService.data[0].id);
});

router.post('/', (req, res) => {
    logger.info(`POST:/{name}`);
    logger.debug(`${req.body}`);

    let id = queueService.addItem(req.body);
    const jobOptions = {
        inMemory: true 
    };
    const options = {
        pageSize : "A4",
        printSelectionOnly: false,
        landscape: false,
        printBackground: true
    }
    exporter.createJob("http://localhost:3000/{name}/" + id, `./{name}-${id}.pdf`, options, jobOptions)
        .then(job => {
            job.on('job-complete', (r) => {
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-disposition': `attachment;filename={name}-${id}.pdf`,
                    'Content-Length': r.results[0].length
                });
                res.end(r.results[0]);
                queueService.removeById(id);
            });
            job.render();
        }).catch(logger.error);
});

module.exports = router;