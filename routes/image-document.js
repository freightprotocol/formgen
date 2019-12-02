const express = require('express');
const jsonUtils = require('../assets/scripts/json-utils');
const queueService = require('../service-modules/image-document-queue-service');
const exporter = require('../service-modules/pdf-generator');

const mockData = require('../assets/image-document-mock-data.json')

const router = express.Router();

const logger = require('../logger');

logger.info('Image Document Route Loaded');

router.get('/view-test', (req, res) => {
    logger.debug(`GET:/image-document/view-test`);
    console.log("DATA", mockData);
    try {
        res.render('image-document', {
            title: 'image-document',
            clientData: jsonUtils.encodeJSON(mockData),
            data: mockData
        });
    } catch(exception) {
        logger.error(exception);
    }
});

router.get('/:id', (req, res) => {
    logger.debug(`GET:/image-document/${req.params.id}`);
    try {
        let postData = queueService.getDataById(req.params.id);
        
        res.render('image-document', {
            title: 'image-document',
            clientData: jsonUtils.encodeJSON(postData),
            data: postData
        });
    } catch(exception) {
        logger.error(exception);
    }
});

router.post('/view', (req, res) => {
    logger.debug(`POST:/image-document/view`);
    let id = queueService.addItem(req.body);
    res.send(queueService.data[0].id);
});

router.post('/', (req, res) => {
    logger.info(`POST:/image-document`);
    logger.debug(req.body);
    
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

    exporter.createJob("http://localhost:3000/image-document/" + id, `./image-document-$.pdf`, options, jobOptions)
        .then(job => {
            job.on('job-complete', (r) => {
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-disposition': `attachment;filename=image-document-$.pdf`,
                    'Content-Length': r.results[0].length
                });
                res.end(r.results[0]);
                queueService.removeById(id);
            });
            job.render();
        }).catch(logger.error);
});

module.exports = router;