const express = require('express');
const router = express.Router();
const {caver, walletHeaders, historyHeaders, KIP7ABI, KIP7Bytecode} = require('../kas');
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
router.get('/test', async (req, res) => {
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

module.exports = router;