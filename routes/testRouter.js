const express = require('express');
const router = express.Router();
const {caver, walletHeaders, historyHeaders, KIP7ABI, KIP17ABI, KIP17Bytecode} = require('../kas');
const axios = require('axios');
const testABI = require('../deploy/testABI.json');

const contractAddress = "0x8885aAb9dA1B41e1e39941084D54f7c2a85FBc56";

const getContractInstance = () => {
    const contractInstance = testABI
        && contractAddress
        && new caver.klay.Contract(testABI, contractAddress);
    
    return contractInstance;
}

// 개인키로 지갑 정보 확인 및 추가
router.post('/integrate', async (req, res) => {
    const account = caver.klay.accounts.privateKeyToAccount(req.body.privateKey);
    caver.klay.accounts.wallet.add(account)
    res.json(account);
})

// 지갑 연동 해제
router.get('/remove', (req, res) => {
    caver.klay.accounts.wallet.clear();
    res.send('ok');
})

// 클레이 잔액 확인
router.get('/balance/:address', async (req, res) => {
    const balance = await caver.klay.getBalance(req.params.address);
    res.send(caver.utils.fromPeb(balance, 'KLAY'));
})

// 포인트 적립
router.get('/save', (req, res) => {
    getContractInstance().methods.mint(req.query.address, req.query.value).send({
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
router.post('/use', (req, res) => {
    const {address} = caver.klay.accounts.privateKeyToAccount(req.body.privateKey);
    
    getContractInstance().methods.burn(address, req.body.value).send({
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
router.get('/list', (req, res) => {
    axios.get(`https://th-api.beta.klaytn.io/v1/kct/ft/${contractAddress}/transfer`, historyHeaders).then(data => {
        if(data.data.items) res.json(data.data);
        else res.json({items:[]})        
    });
})

// 새 컨트랙트 배포
router.get('/deploy', async (req, res) => {
    const {data} = await axios.post('https://wallet-api.beta.klaytn.io/v2/tx/contract/deploy', {
        "from": "0xc2d9c16bee571c3baf98c00e321052c4d4095859",
        "value": "0x0",
        "submit": true,
        "gas_limit": 30000000,
        "input": caver.abi.encodeContractDeploy(
            KIP17ABI,
            `0x${KIP17Bytecode.object}`,
            "Kunité", 1, 3
        )
    }, walletHeaders);

    // 채굴 될 때까지 기다린 후 컨트랙트 주소 반환
    setTimeout(async () => {
        const result = await axios.get(`https://wallet-api.beta.klaytn.io/v2/tx/${data.result.transaction_hash}`, walletHeaders);
        
        res.send(result.data.result.contractAddress);
    }, 3000);
})

// 테스트
router.get('/test', async (req, res) => {
    //console.log(KIP7ABI[9]); // 민트
    //console.log(KIP7ABI[15]); // 번
    // res.send(KIP17ABI[14]); // 민트
    res.json(KIP17ABI); return;

    const callByte = caver.abi.encodeFunctionCall(KIP17ABI[14], 
        ['0xc2d9c16bee571c3baf98c00e321052c4d4095859']
    )

    axios.post('https://wallet-api.beta.klaytn.io/v2/tx/contract/execute',{
        "from": "0xc2d9c16bee571c3baf98c00e321052c4d4095859",
        "to": "0x209c0e8290688031d233493c2fab40436c49eaa3",
        "value": "0x0",
        "input": callByte,
        "submit": true,
        "gas_limit": 3000000
    }, walletHeaders)
    .then(({data}) => {
        console.log(data.result);
        
    }, console.log)
})

module.exports = router;