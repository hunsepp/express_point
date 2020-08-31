const express = require('express');
const dotenv = require('dotenv');
const Caver = require('caver-js');
const axios = require('axios');
const KIP7ABI = require('./deploy/KIP7ABI.json');
const KIP7Bytecode = require('./deploy/KIP7Bytecode.json');
const mongoose = require('mongoose');
const User = require('./model/user');
const Menu = require('./model/menu');

const app = express();
const port = 5000;

let contractAddress = '0x8885aAb9dA1B41e1e39941084D54f7c2a85FBc56';

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(() => console.log('connected to mongodb'))
    .catch(e => console.error(e));

//caver
const option = {
    headers: [
        {name: 'Authorization', value: 'Basic ' + Buffer.from(process.env.ACCESS_KEY + ':' + process.env.SECRET_ACCESS).toString('base64')},
        {name: 'x-krn', value: 'krn:1001:node'},
    ]
};
const caver = new Caver(new Caver.providers.HttpProvider("https://node-api.beta.klaytn.io/v1/klaytn", option));

// token contract
const getContract = () => {
    const contractInstance = KIP7ABI
        && contractAddress
        && new caver.klay.Contract(KIP7ABI, contractAddress);
    
    return contractInstance;
}

// wallet headers
const walletHeaders = {
    headers: {
        "Authorization": 'Basic ' + Buffer.from(process.env.ACCESS_KEY + ':' + process.env.SECRET_ACCESS).toString('base64'),
        "x-krn": 'krn:1001:wallet:122:account:default'
    }
}

// 개인키로 지갑 정보 및 클레이 잔액 확인
app.post('/api/integrate', async (req, res) => {
    const account = caver.klay.accounts.privateKeyToAccount(req.body.privateKey);
    caver.klay.accounts.wallet.add(account)
    res.json(account);
})

// 지갑 연동 해제
app.get('/api/remove', (req, res) => {
    caver.klay.accounts.wallet.clear();
    res.send('ok');
})

// 클레이 잔액 확인
app.get('/api/balance/:address', async (req, res) => {
    const balance = await caver.klay.getBalance(req.params.address);
    res.send(caver.utils.fromPeb(balance, 'KLAY'));
})

// 포인트 적립
app.get('/api/save', async (req, res) => {
    await getContract().methods.mint(req.query.address, req.query.value).send({
        from: caver.klay.accounts.wallet[0].address,
        gas: '3000000',
    })
    // 성공
    .once('receipt', receipt => res.json(receipt)
    )
    // 실패
    .once('error', error => res.json(error)
    );
})

// 포인트 사용
app.post('/api/use', async (req, res) => {
    const {address} = caver.klay.accounts.privateKeyToAccount(req.body.privateKey);
    
    await getContract().methods.burn(address, req.body.value).send({
        from: caver.klay.accounts.wallet[0].address,
        gas: '3000000',
    })
    // 성공
    .once('receipt', receipt => res.json(receipt)
    )
    // 실패
    .once('error', error => res.json(error)
    );
});

// 토큰 적립/사용 내역
app.get('/api/list', (req, res) => {
    axios.get(`https://th-api.beta.klaytn.io/v1/kct/ft/${contractAddress}/transfer`, {
        headers: {
            "Authorization": 'Basic ' + Buffer.from(process.env.ACCESS_KEY + ':' + process.env.SECRET_ACCESS).toString('base64'),
            "x-krn": 'krn:1001:th' 
        }
    }).then(data => {
        if(data.data.items) res.json(data.data);
        else res.json({items:[]})        
    });
})

// 새 컨트랙트 배포
app.get('/api/deploy', async (req, res) => {
    const {data} = await axios.post('https://wallet-api.beta.klaytn.io/v2/tx/contract/deploy', {
        "from": "0xc2d9c16bee571c3baf98c00e321052c4d4095859",
        "value": "0x0",
        "submit": true,
        "gas_limit": 3000000,
        "input": caver.abi.encodeContractDeploy(
            KIP7ABI,
            `0x${KIP7Bytecode.object}`,
            "배포"
        )
    }, walletHeaders);

    // 채굴 될 때까지 기다린 후 컨트랙트 주소 반환
    setTimeout(async () => {
        const result = await axios.get(`https://wallet-api.beta.klaytn.io/v2/tx/${data.result.transaction_hash}`, walletHeaders);
        
        contractAddress = result.data.result.contractAddress;
        res.send(contractAddress);
    }, 3000);
})

// 테스트
app.get('/test', async (req, res) => {
    //console.log(KIP7ABI[9]); // 민트
    //console.log(KIP7ABI[15]); // 번

    const callByte = caver.abi.encodeFunctionCall(KIP7ABI[9], 
        ['0xa85baDfd203AE6FABFFa302D5470854Eee2385D7', 5]
    )
    res.send(callByte);

    axios.post('https://wallet-api.beta.klaytn.io/v2/tx/contract/execute',{
        "from": "0xc2d9c16bee571c3baf98c00e321052c4d4095859",
        "to": "0xd993dbe444b7f8ef11f321bab815280fea77ec10",
        "value": "0x0",
        "input": callByte,
        "submit": true
    }, walletHeaders)
    .then(({data}) => {
        console.log(data.result);
        
    }, console.log)
})

// 카카오 계정 연동/로그인
app.post('/api/login', (req, res) => {
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
app.get('/api/kakao/:token', (req, res) => {
    User.findOne({access: req.params.token}, (err, user) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, user});
    })
})

// 메뉴 등록
app.post('/api/menu', (req, res) => {
    const menu = new Menu();
    menu.kakaoId = req.body.kakaoId;
    menu.name = req.body.name;
    menu.price = req.body.price;

    menu.save(err => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1});
    });
})

// 메뉴 목록
app.get('/api/menu/:id', (req, res) => {
    Menu.find({kakaoId: req.params.id}, (err, menus) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1, menus});
    })
})

// 메뉴 삭제
app.delete('/api/menu/:id', (req, res) => {
    Menu.deleteOne({_id: req.params.id}, (err, output) => {
        if(err) res.json({result: 0, error: err});
        else res.json({result: 1});
    })
})

// 서버 시작
app.listen(port, () => {
    console.log(`server start port ${port}`);
});