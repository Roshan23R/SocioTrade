require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();
const {
  PRIVATE_KEY,
  POLYGON_API_KEY,

} = process.env;
const config = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: " http://127.0.0.1:8545/",
    },
    hardhat: {},
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY],
    },
    matic: {
      url: "https://rpc-mainnet.maticvigil.com",
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: POLYGON_API_KEY,
      polygon: POLYGON_API_KEY,
    },
  },
  gasReporter: { enabled: true },
  solidity: {
    compilers: [
      {
        version: "0.8.20",
      },
      {
        version: "0.8.16",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "berlin",
    },
  },
  docgen: {
    output: "docs",
    pages: () => "api.md",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

module.exports=  config;
