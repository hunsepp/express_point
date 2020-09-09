const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    store: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Store'},
    name: {type: String, required: true},
    price: {type: String, required: true},
    category: String,
    create: {type: Date, default: Date.now},
})

module.exports = mongoose.model('Menu', menuSchema);