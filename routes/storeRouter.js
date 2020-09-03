const express = require('express');
const router = express.Router();
const axios = require('axios');
const {walletHeaders} = require('../kas');
const Store = require('../model/store');

// 카카오 계정으로 매장 연동/로그인
router.post('/', (req, res) => {
    const kakaoInfo = req.body;

    Store.findOne({kakaoId: kakaoInfo.profile.id}, async (err, store) => {
        if(err) return res.status(500).json({error: err});
        
        if(!store) {
            store = new Store();
            store.kakaoId = kakaoInfo.profile.id;
            store.approve = "미승인";

            await axios.post('https://wallet-api.beta.klaytn.io/v2/account', "", walletHeaders).then(({data}) => {
                store.account = data.result.address;
            });
        }

        store.access = kakaoInfo.response.access_token;
        store.refresh = kakaoInfo.response.refresh_token;
        
        store.save(err => {
            if(err) res.json({error: err});
            else res.json({result: 1, store});
        });
    })
})

// 액세스 토큰으로 매장정보 확인
router.get('/:token', (req, res) => {
    Store.findOne({access: req.params.token}, (err, store) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, store});
    })
})

// 매장 정보 업데이트
router.put('/:account', (req, res) => {
    Store.findOneAndUpdate({account: req.params.account}, req.body, {new: true}, (err, store) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, store});
    })
})

// 매장 목록
router.get('/', (req, res) => {
    Store.find({approve: "승인"}, (err, stores) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, stores});
    })
})

module.exports = router;