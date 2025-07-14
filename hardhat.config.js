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
  },
  etherscan: {
    apiKey: {
      'somnia-testnet': "any_string", // Tidak butuh API key
      // Tambahkan placeholder untuk jaringan lain jika mereka butuh API key
      // Pharos: process.env.PHAROS_API_KEY || "", 
    },
    customChains: [
      {
        network: "somnia-testnet",
        chainId: 50312,
        urls: {
          apiURL: "https://somnia.w3us.site/api",
          browserURL: "https://somnia.w3us.site"
        }
      },
      // Anda bisa menambahkan konfigurasi untuk jaringan lain di sini
      // {
      //   network: "Pharos",
      //   chainId: 6663,
      //   urls: {
      //     apiURL: "https://pharos-testnet.scroll.io/api",
      //     browserURL: "https://pharos-testnet.scroll.io/"
      //   }
      // }
    ]
  }
};
