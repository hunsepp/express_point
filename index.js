const express = require('express');
const dotenv = require('dotenv');
const Caver = require('caver-js');
const deployedABI = require('./deployedABI.json');
const axios = require('axios');

const app = express();
const port = 5000;
const contractAddress = '0xDe04E71ff30eCA98cdd30Edc111AFD2386ae029d';

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

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
    const contractInstance = deployedABI
        && contractAddress
        && new caver.klay.Contract(deployedABI, contractAddress);
    
    return contractInstance;
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
    await getContract().methods.transfer(req.query.address, req.query.value).send({
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
    axios.get(`https://th-api.beta.klaytn.io/v1/kct/ft/${contractAddress}`, {
        headers: {
            "Authorization": 'Basic ' + Buffer.from(process.env.ACCESS_KEY + ':' + process.env.SECRET_ACCESS).toString('base64'),
            "Content-Type": "application/json",
            "x-krn": 'krn:1001:th' 
        }
    }).then(data => {
        console.log(data)
        res.send(data);
    });

    res.send('')
})

// 서버 시작
app.listen(port, () => {
    console.log(`server start port ${port}`);
});