const gen = require('custom-template-generator');

function genCode(name, data) {
    gen({
        componentName: name,
        customTemplatesUrl: './templates/',
        dest: '',
        templateName: 'form',
        wrapInFolder: false
    });
}

genCode(process.argv[2], {});