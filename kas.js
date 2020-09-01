const Caver = require('caver-js');
const KIP7ABI = require('./deploy/KIP7ABI.json');
const KIP7Bytecode = require('./deploy/KIP7Bytecode.json');
const dotenv = require('dotenv');

dotenv.config();

// point contract
const pointContract = '0x8885aAb9dA1B41e1e39941084D54f7c2a85FBc56';

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
    pointContract,
    getPointContract,
    walletHeaders,
    historyHeaders,
}