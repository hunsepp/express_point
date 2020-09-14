const express = require('express');
const router = express.Router();
const Store = require('../model/store');
const {caver, walletHeaders, KIP17ABI, KIP17Bytecode, manageAccount} = require('../kas');
const axios = require('axios');

// 승인 요청 중 매장목록
router.get('/', (req, res) => {
    Store.find({approve: "승인요청"}, (err, stores) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, stores});
    })
})

// 매장 승인 처리
router.put('/', (req, res) => {
    Store.findOne({_id: req.body.id}, async (err, store) => {
        if(err) return res.json({result: 0, error: err});

        // 새로운 스탬프 컨트랙트 TX 요청
        const {data} = await axios.post('https://wallet-api.beta.klaytn.io/v2/tx/fd/contract/deploy', {
            "from": store.account,
            "fee_payer": manageAccount,
            "value": "0x0",
            "submit": true,
            "gas_limit": 30000000,
            "input": caver.abi.encodeContractDeploy(
                KIP17ABI,
                `0x${KIP17Bytecode.object}`,
                store.name, 365, 10
            )
        }, walletHeaders);

        // 채굴 될 때까지 기다린 후 컨트랙트 주소 반환
        setTimeout(async () => {
            const result = await axios.get(`https://wallet-api.beta.klaytn.io/v2/tx/${data.result.transaction_hash}`, walletHeaders);
            
            // 매장의 배포된 스마트 컨트랙트 주소와 승인여부 변경
            store.contract = result.data.result.contractAddress;
            store.approve = '승인';
            
            store.save(err => {
                if(err) res.json({result: 0, error: err});
                else res.json({result: 1, store});
            });
        }, 3000);
    })
})

// 승인 요청
router.post('/:account', (req, res) => {
    Store.findOneAndUpdate({account: req.params.account}, {approve: '승인요청'}, {new: true}, (err, store) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, store});
    })
})

module.exports = router;