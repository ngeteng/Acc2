require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY tidak ditemukan di file .env");
}

module.exports = {
  solidity: "0.8.20",
  networks: {
    Xos: {
      url: process.env.RPC_URL_XOS || "",
      accounts: [privateKey],
    },
    Monad: {
      url: process.env.RPC_URL_MND || "",
      accounts: [privateKey],
    },
    Pharos: {
      url: process.env.RPC_URL_PHAROS || "",
      accounts: [privateKey],
    },
    'Giwa': {
      url: process.env.RPC_URL_GIWA || "",
      accounts: [privateKey],
    },
    OG: {
      url: process.env.RPC_URL_OG || "",
      accounts: [privateKey],
    }
  }
};
