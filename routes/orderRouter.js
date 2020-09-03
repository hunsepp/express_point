const express = require('express');
const router = express.Router();
const Order = require('../model/Order');
const {caver, KIP7ABI, walletHeaders, pointContract} = require('../kas');
const axios = require('axios');

// 주문 등록
router.post('/', (req, res) => {
    const {selectList, total, address} = req.body;
    const point = total * 0.01;

    const order = new Order;
    order.store = selectList[0].store;
    order.total = total;
    order.menus = selectList;
    order.point = point
    order.address = address;

    order.save(err => {
        if(err) res.json({result: 0, error: err});
        // 포인트 적립 tx
        else {
            const callByte = caver.abi.encodeFunctionCall(KIP7ABI[9], [address, point]);
            axios.post('https://wallet-api.beta.klaytn.io/v2/tx/contract/execute',{
                "from": "0xc2d9c16bee571c3baf98c00e321052c4d4095859",
                "to": pointContract,
                "value": "0x0",
                "input": callByte,
                "submit": true
            }, walletHeaders)
            // 적립 성공
            .then(({data}) => {
                order.txHash = data.result.transaction_hash;
                order.save(err => {
                    if(err) res.json({result: 0, error: err});
                    else res.json({result: 1, order: order._id});
                })
            // 적립 실패
            }, err => res.json({result: 0, error: err}))
        };
    });
})

// 단일 주문 조회
router.get('/:id', (req, res) => {
    Order.findOne({_id: req.params.id})
    .populate('store')
    .exec((err, order) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, order});
    })
})

// 주문 리스트
router.get('/list/:address', (req, res) => {
    Order.find({address: req.params.address})
    .populate('store')
    .exec((err, orders) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, orderList: orders});
    })
})

module.exports = router;