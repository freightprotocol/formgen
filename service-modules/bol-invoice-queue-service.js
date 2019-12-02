const uuidv4 = require('uuid/v4');

class BolInvoiceService {
    constructor() {
        this.data = new Array();
    }

    getDataById(id) {
        for (let i = 0; i < this.data.length; i++ ){
            if (this.data[i].id === id)
                return this.data[i].data;
        }
    }
    
    removeById(id) {
        this.data.splice(this.getDataById(id), 1);
    }

    addItem (obj) {
        let id = uuidv4();
        let objData = {data: obj, id: id}
        this.data.push(objData);
        return id;
    }
}

module.exports = new BolInvoiceService();