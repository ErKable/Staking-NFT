require("@nomiclabs/hardhat-waffle")
require("@atixlabs/hardhat-time-n-mine")
require("solidity-coverage")
var crypto = require("crypto")
//require("hardhat-gas-reporter");

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.15",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.8.13",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.5.16",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.4.18",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.8.3",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    mocha: {
        timeout: 100000,
    },
    gasReporter: {
        currency: "USD",
        gasPrice: 5,
    },
    networks: {
        hardhat: {
            forking: {
                url: "https://bsc-dataseed1.defibit.io/", //"https://bsc-dataseed1.defibit.io/",//"http://localhost:8547", 'https://cronosrpc-1.xstaking.sg'
            },
            accounts: [
                {
                    balance: "10000000000000000000000",
                    privateKey: process.env.PKEY_ACC1,
                },
                {
                    balance: "10000000000000000000000",
                    privateKey: "0x" + crypto.randomBytes(32).toString("hex"),
                },
                {
                    balance: "10000000000000000000000",
                    privateKey: "0x" + crypto.randomBytes(32).toString("hex"),
                },
            ],
        },
        bsctest: {
            url: "https://speedy-nodes-nyc.moralis.io/d16ed5928caaf9d2c20fe271/bsc/testnet",
            accounts: [
                "a91310a526c285580005f10bc45678a8b8feda011418df20ca61ac0bdfc6cbe2",
            ],
        },
    },
}
