const express = require('express');
const router = express.Router();
const {walletHeaders} = require('../kas');
const User = require('../model/user');

// 카카오 계정 연동/로그인
router.post('/', (req, res) => {
    const kakaoInfo = req.body;

    User.findOne({kakaoId: kakaoInfo.profile.id}, async (err, user) => {
        if(err) return res.status(500).json({error: err});

        if(!user) {
            user = new User();
            user.kakaoId = kakaoInfo.profile.id;

            await axios.post('https://wallet-api.beta.klaytn.io/v2/account', "", walletHeaders).then(({data}) => {
                user.address = data.result.address;
            });
        }

        user.access = kakaoInfo.response.access_token;
        user.refresh = kakaoInfo.response.refresh_token;

        user.save(err => {
            if(err) res.json({error: err});
            else res.json({result: 1, user});
        });
    })
})

// 액세스 토큰으로 정보 확인
router.get('/:token', (req, res) => {
    User.findOne({access: req.params.token}, (err, user) => {
        if(err || !user) res.json({result: 0, error: err});
        else res.json({result: 1, user});
    })
})

module.exports = router;