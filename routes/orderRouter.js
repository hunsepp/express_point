const express = require('express');
const router = express.Router();
const Order = require('../model/Order');
const {caver, KIP7ABI, KIP17ABI, walletHeaders, pointContract, manageAccount} = require('../kas');
const axios = require('axios');

// 주문 등록
router.post('/', async (req, res) => {
    const {selectList, total, address} = req.body;
    let point = req.body.point;

    const store = selectList[0].store;

    const order = new Order;
    order.store = store._id;
    order.total = total;
    order.menus = selectList;
    order.address = address;

    try {
        let callPointByte;

        // 포인트 사용
        if(point) {
            point = req.body.point * -1;
            callPointByte = caver.abi.encodeFunctionCall(KIP7ABI[15], [address, point * -1]);

        // 포인트 적립
        } else {
            point = total * 0.01
            callPointByte = caver.abi.encodeFunctionCall(KIP7ABI[9], [address, point]);
        }
        
        order.point = point;
        
        // 포인트 트랜잭션 처리
        const {data} = await axios.post('https://wallet-api.beta.klaytn.io/v2/tx/contract/execute',{
            "from": manageAccount,
            "to": pointContract,
            "value": "0x0",
            "input": callPointByte,
            "submit": true
        }, walletHeaders);
        
        // 트랜잭션 성공시 해시값 받아오기
        order.txHash = data.result.transaction_hash;

        // 스탬프 컨트랙트가 있을 경우 스탬프 적립
        if(store.contract) {
            const callStampByte = caver.abi.encodeFunctionCall(KIP17ABI[14], [address]);
            const result = await axios.post('https://wallet-api.beta.klaytn.io/v2/tx/fd/contract/execute',{
                "from": store.account,
                "to": store.contract,
                "fee_payer": manageAccount,
                "value": "0x0",
                "input": callStampByte,
                "submit": true
            }, walletHeaders);
            order.stampHash = result.data.result.transaction_hash;
        }

    // 적립 실패시
    } catch(err) {
        return res.json({result: 0, error: err});
    }

    order.save(err => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, order: order._id});
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