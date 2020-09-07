const Caver = require('caver-js');
const KIP7ABI = require('./deploy/KIP7ABI.json');
const KIP7Bytecode = require('./deploy/KIP7Bytecode.json');
const KIP17ABI = require('./deploy/KIP17ABI.json');
const KIP17Bytecode = require('./deploy/KIP17Bytecode.json');
const dotenv = require('dotenv');

dotenv.config();

// point contract
const pointContract = '0x674a77c1ab37ef710398a6fc689b397ab87d92dd';

// 관리자 account
const manageAccount = '0xc2d9c16bee571c3baf98c00e321052c4d4095859';

// point contract instance
const getPointContract = () => {
    const contractInstance = KIP7ABI
        && pointContract
        && new caver.klay.Contract(KIP7ABI, pointContract);
    
    return contractInstance;
}

// kas node api
const option = {
    headers: [
        {name: 'Authorization', value: 'Basic ' + Buffer.from(process.env.ACCESS_KEY + ':' + process.env.SECRET_ACCESS).toString('base64')},
        {name: 'x-krn', value: 'krn:1001:node'},
    ]
};
const caver = new Caver(new Caver.providers.HttpProvider("https://node-api.beta.klaytn.io/v1/klaytn", option));

// kas wallet headers
const walletHeaders = {
    headers: {
        "Authorization": 'Basic ' + Buffer.from(process.env.ACCESS_KEY + ':' + process.env.SECRET_ACCESS).toString('base64'),
        "x-krn": 'krn:1001:wallet:122:account:default'
    }
}

// kas history headers
const historyHeaders = {
    headers: {
        "Authorization": 'Basic ' + Buffer.from(process.env.ACCESS_KEY + ':' + process.env.SECRET_ACCESS).toString('base64'),
        "x-krn": 'krn:1001:th' 
    }
}

module.exports = {
    caver,
    KIP7ABI,
    KIP7Bytecode,
    KIP17ABI,
    KIP17Bytecode,
    pointContract,
    manageAccount,
    getPointContract,
    walletHeaders,
    historyHeaders,
}