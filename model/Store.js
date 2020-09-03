const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    kakaoId: {type: String, required: true, unique: true},
    account: {type: String, required: true, unique: true},
    access: {type: String, required: true, unique: true},
    refresh: {type: String, required: true, unique: true},
    contract: {type: String},
    approve: {type: String, required: true},
    name: {type: String},
    category: {type: String},
    address: {type: String},
    discription: {type: String},
    menus: [{type: mongoose.Schema.Types.ObjectId, ref: 'Menu'}]
});

module.exports = mongoose.model('Store', storeSchema);