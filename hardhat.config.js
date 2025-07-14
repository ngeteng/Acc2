require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY tidak ditemukan di file .env");
}

module.exports = {
  solidity: "0.8.20",
  networks: {
    Monad: {
      url: process.env.RPC_URL_MONAD || "",
      accounts: [privateKey],
    },
    Pharos: {
      url: process.env.RPC_URL_PHAROS || "",
      accounts: [privateKey],
    },
    'somnia-testnet': {
      url: process.env.RPC_URL_SOMNIA || "https://dream-rpc.somnia.network/",
      accounts: [privateKey],
    },
    OG: {
      url: process.env.RPC_URL_OG || "",
      accounts: [privateKey],
    },
  }
};
