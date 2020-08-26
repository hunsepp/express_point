const express = require('express');
const dotenv = require('dotenv');
const Caver = require('caver-js');
const axios = require('axios');
const KIP7ABI = require('./KIP7ABI.json');
const KIP7Bytecode = require('./KIP7Bytecode.json');

const app = express();
const port = 5000;

let contractAddress = '0x8885aAb9dA1B41e1e39941084D54f7c2a85FBc56';

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
        "from": caver.klay.accounts.wallet[0].address,
        "value": "0x0",
        "submit": true,
        "gas_limit": 3000000,
        "input": `0x${KIP7Bytecode.object}`
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

})

// 서버 시작
app.listen(port, () => {
    console.log(`server start port ${port}`);
});