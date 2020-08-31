const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    kakaoId: {type: String, required: true, unique: true},
    address: {type: String, required: true, unique: true},
    access: {type: String, required: true, unique: true},
    refresh: {type: String, required: true, unique: true},
})

module.exports = mongoose.model('user', userSchema);