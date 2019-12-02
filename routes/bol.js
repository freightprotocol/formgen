const express = require('express');
const jsonUtils = require('../assets/scripts/json-utils');
const bolQueueService = require('../service-modules/bol-queue-service');
const exporter = require('../service-modules/pdf-generator');

const router = express.Router();

const logger = require('../logger');

logger.info('BoL Route Loaded');

router.get('/:id', (req, res) => {
    logger.debug(`GET:/bol/${req.params.id}`);
    let bol = bolQueueService.getDataById(req.params.id);
    
    res.render('bol', {
        title: 'BA - Bill of Lading',
        clientData: jsonUtils.encodeJSON(bol),
        data: bol,
        additionalPages: getAdditionalPagedData(bol.CustomerOrderInfo, bol.CarrierInfo)
    });
});

router.post('/view', (req, res) => {
    logger.debug(`POST:/bol/view`);
    let id = bolQueueService.addItem(req.body);
    res.send(bolQueueService.data[0].id);
});

router.post('/', (req, res) => {
    logger.info(`POST:/bol/`);
    logger.debug(req.body);
    let id = bolQueueService.addItem(req.body);
    const jobOptions = {
        inMemory: true 
    };
    const options = {
        pageSize : "A4",
        printSelectionOnly: false,
        landscape: false,
        printBackground: true
    }
    exporter.createJob("http://localhost:3000/bol/" + id, `./bol-${id}.pdf`, options, jobOptions)
        .then(job => {
            job.on('job-complete', (r) => {
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-disposition': `attachment;filename=bol-${req.body.BolNumber}.pdf`,
                    'Content-Length': r.results[0].length
                });
                res.end(r.results[0]);
                bolQueueService.removeById(id);
            });
            job.render();
        }).catch(logger.error);
});

module.exports = router;

function splitPages(ary, pageSize) {
    let numberOfPages = Math.ceil(ary.length / pageSize);
    let pages = [];
    for(let i = 0; i < numberOfPages; i++) {
        pages.push(ary.slice(i * pageSize, i * pageSize + pageSize));
    }
    return pages;
}

function mergeBoLPageArrays(coi, ci) {
    let count = coi.length <= ci.length ? coi.length : ci.length;
    let output = [];
    for(let i = 0; i < count; i++) {
        output.push({CustomerOrderInfo: [], CarrierInfo: [], pageNumber: 0, CioTotals: {PackagesTotal: 0, WeightTotal: 0}, CiTotals: {HandlingUnitQtyTotal: 0, PackageQtyTotal: 0, WeightTotal: 0}});

        if (i < coi.length) {
            output[i].CustomerOrderInfo = coi[i];
            output[i].CioTotals.PackagesTotal = getTotal(coi[i], 'Quantity');
            output[i].CioTotals.WeightTotal = getTotal(coi[i], 'Weight');
        }
        if (i < ci.length) {
             output[i].CarrierInfo = ci[i];
             output[i].CiTotals.HandlingUnitQtyTotal = getTotal(ci[i], 'HandlingUnitQty');
             output[i].CiTotals.PackageQtyTotal = getTotal(ci[i], 'PackageQty');
             output[i].CiTotals.WeightTotal = getTotal(ci[i], 'Weight');
        }
        output[i].pageNumber = i + 2;
    }
    return output;
}

function getTotal(ary, property) {
    var total = 0;
    for(var i = 0; i < ary.length; i++) {
        total += Number(ary[i][property]);
    }
    return total;
}

function getAdditionalPagedData(customerOrderInfo, carrierInfo) {
    if (customerOrderInfo.length < 1 && carrierInfo.length < 1) return [];
    customerOrderInfoPages = splitPages(customerOrderInfo.slice(5), 16);
    carrierInfoPages = splitPages(carrierInfo.slice(5), 16);
    return mergeBoLPageArrays(customerOrderInfoPages, carrierInfoPages);
}