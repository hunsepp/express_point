const express = require('express');
const router = express.Router();
const {historyHeaders, pointContract} = require('../kas');
const axios = require('axios');

// 포인트 내역 조회
router.get('/:address', (req, res) => {
    axios.get(`https://th-api.beta.klaytn.io/v1/kct/ft/${pointContract}/transfer`, {
        ...historyHeaders,
        eoaAddress: req.params.address
    }).then(({data}) => {
        res.json({result: 1, pointList: data.items});
    }, err => res.json({result: 0, error: err}));
})

module.exports = router;