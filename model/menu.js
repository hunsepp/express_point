const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    kakaoId: {type: String, required: true, ref: 'users'},
    name: {type: String, required: true},
    price: {type: String, required: true},
})

module.exports = mongoose.model('menu', menuSchema);