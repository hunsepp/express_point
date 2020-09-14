const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    kakaoId: {type: String, required: true, unique: true},
    account: {type: String, required: true, unique: true},
    access: {type: String},
    refresh: {type: String},
    contract: {type: String},
    approve: {type: String, required: true},
    name: {type: String},
    category: {type: String},
    address: {type: String},
    discription: {type: String},
    menus: [{type: mongoose.Schema.Types.ObjectId, ref: 'Menu'}],
    create: {type: Date, default: Date.now},
    option: mongoose.Schema.Types.Mixed,
    open: String,
    close: String
});

module.exports = mongoose.model('Store', storeSchema);