const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    store: {type: mongoose.Schema.Types.ObjectId, ref: 'Store'},
    total: {type: Number},
    menus: [new mongoose.Schema({
        _id: {type: mongoose.Schema.Types.ObjectId, ref: 'Menu'},
        name: {type: String},
        price: {type: Number},
        count: {type: Number}
    })],
    create: {type: Date, default: Date.now},
    point: Number,
    txHash: String,
});

module.exports = mongoose.model('Order', orderSchema);