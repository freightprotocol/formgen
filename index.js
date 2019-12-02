const express = require('express');
const hbs = require('express-hbs');
const bodyParser = require('body-parser');
const fs = require('fs');
const logger = require('./logger');

const moment = require('moment');

hbs.handlebars = require('handlebars');

hbs.registerHelper('toJson', (data) => {
    return JSON.stringify(data);
});

let app = express();
let exporter = require('./service-modules/pdf-generator');

app.use(express.static('assets/css'));
app.use(express.static('assets/scripts'));
app.use(bodyParser.json({
    parameterLimit: 100000,
    limit: '50mb',
    extended: true
}));

hbs.registerHelper('listItem', (from, to, context, options) => {
    logger.debug('listItem helper called. Formating list items');
    var item = "";
    for (var i = from, j = to; i < j; i++) {
        item = item + options.fn(context[i]);
    }
    return item;
});

hbs.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

hbs.registerHelper('formatDate', (dateString, format) => {
    return moment(dateString).format(format);
});

app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials'
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

fs.readdir(__dirname + '/routes/', (err, files) => {
    if (err) return logger.error(err);
    files.forEach(file => {
        let routeName = file.split('.')[0];
        logger.debug(`Creating route '/${routeName}' from './routes/${routeName}`);
        app.use(`/${routeName}`, require(`./routes/${routeName}`));
    });
});

app.use(`/customer-invoice`, require(`./routes/bol-invoice.js`));
app.use(`/broker-invoice`, require(`./routes/bol-invoice.js`));

exporter.on('charged', () => {
    app.listen(3000, () => {
        logger.info('Service is running on port 3000');
    });
});

exporter.start();
