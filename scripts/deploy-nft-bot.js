const { ethers, config, run } = require("hardhat");
const axios = require("axios");
require("dotenv").config();

// =============================================================
// KONFIGURASI
// =============================================================
// Pastikan nama jaringan di sini sama persis dengan di hardhat.config.js
const targetNetworks = ["Pharos", "somnia-testnet", "OG"];

// =============================================================
// FUNGSI LAPORAN TELEGRAM
// =============================================================
async function sendMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("Variabel Telegram tidak diatur, laporan dilewati.");
    return;
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error("Gagal mengirim pesan ke Telegram:", error.message);
  }
}

// =============================================================
// FUNGSI HELPER (PASTIKAN BAGIAN INI ADA)
// =============================================================
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function shortenAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(address.length - 4)}`;
}

// =============================================================
// SCRIPT UTAMA
// =============================================================
async function main() {
  const deploymentResults = [];
  const startTime = new Date();
  
  console.log(`\n🚀 Memulai Bot Ultimate (Deploy, Stake & Auto-Verify) ke ${targetNetworks.length} jaringan...`);

  for (const networkName of targetNetworks) {
    console.log(`\n=================================================`);
    console.log(`- Memproses jaringan: ${networkName.toUpperCase()}`);
    console.log(`=================================================`);

    try {
      // Pastikan ada konfigurasi URL untuk jaringan ini
      if (!config.networks[networkName] || !config.networks[networkName].url) {
        throw new Error(`Konfigurasi jaringan untuk '${networkName}' tidak ditemukan atau tidak memiliki URL di hardhat.config.js`);
      }
        
      const provider = new ethers.JsonRpcProvider(config.networks[networkName].url);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      
      const randomName = `NFT ${generateRandomString(6)}`;
      const randomSymbol = generateRandomString(4).toUpperCase();
      console.log(`  - Koleksi Dibuat: ${randomName} (${randomSymbol})`);

      // Tahap 1: Deploy NFT
      console.log("  - [1/5] Mendeploy MyNFT...");
      const nftFactory = await ethers.getContractFactory("MyNFT", signer);
      const nft = await nftFactory.deploy(randomName, randomSymbol);
      await nft.waitForDeployment();
      const nftAddress = await nft.getAddress();
      console.log(`✔  MyNFT ter-deploy di: ${nftAddress}`);

      // Tahap 2: Minting
      console.log(`  - [2/5] Memulai minting 5 NFT...`);
      const sampleTokenURI = "ipfs://bafkreihg5orwinp5t2bwxp7gsfb24v3cnitu72klbto3dyx7j2x2qg7dnm";
      for (let i = 0; i < 5; i++) {
        const mintTx = await nft.safeMint(signer.address, `${sampleTokenURI}/${i}.json`);
        await mintTx.wait();
      }
      console.log("✔  Proses minting selesai.");
      
      // Tahap 3: Deploy Vault
      console.log("  - [3/5] Mendeploy NFTStakingVault...");
      const vaultFactory = await ethers.getContractFactory("NFTStakingVault", signer);
      const vault = await vaultFactory.deploy(nftAddress);
      await vault.waitForDeployment();
      const vaultAddress = await vault.getAddress();
      console.log(`✔  NFTStakingVault ter-deploy di: ${vaultAddress}`);

      // Tahap 4: Staking
      console.log("  - [4/5] Melakukan Staking NFT #0...");
      const approveTx = await nft.approve(vaultAddress, 0);
      await approveTx.wait();
      const stakeTx = await vault.stake(0);
      await stakeTx.wait();
      console.log("✔  Staking berhasil!");

      // Tahap 5: Verifikasi Otomatis
      console.log("  - [5/5] Mencoba verifikasi otomatis...");
      const customChain = config.etherscan.customChains.find(chain => chain.network === networkName);

      if (customChain) {
        console.log(`    - Konfigurasi verifikasi untuk ${networkName} ditemukan. Menjalankan...`);
        // Jeda singkat sebelum verifikasi
        await new Promise(resolve => setTimeout(resolve, 20000)); 

        try {
          await run("verify:verify", { address: nftAddress, constructorArguments: [randomName, randomSymbol] });
          console.log(`    ✔  Kontrak NFT di ${nftAddress} berhasil diverifikasi.`);
        } catch(verifyNftError) {
          console.warn(`    ⚠  Verifikasi Kontrak NFT gagal: ${verifyNftError.message}`);
        }

        // Jeda lagi sebelum verifikasi kontrak kedua
        await new Promise(resolve => setTimeout(resolve, 20000));

        try {
          await run("verify:verify", { address: vaultAddress, constructorArguments: [nftAddress] });
          console.log(`    ✔  Kontrak Vault di ${vaultAddress} berhasil diverifikasi.`);
        } catch (verifyVaultError) {
          console.warn(`    ⚠  Verifikasi Kontrak Vault gagal: ${verifyVaultError.message}`);
        }
      } else {
        console.log(`    - Tidak ada konfigurasi verifikasi untuk ${networkName}. Dilewati.`);
      }
      
      console.log(`✔  Proses di jaringan ${networkName.toUpperCase()} SUKSES.`);
      deploymentResults.push(`✅ *${networkName.toUpperCase()}*: SUKSES!`);

    } catch (error) {
      console.error(`❌ Proses GAGAL di jaringan ${networkName.toUpperCase()}:`, error.message);
      deploymentResults.push(`❌ *${networkName.toUpperCase()}*: GAGAL!`);
    }
  }

  // ... (Bagian MEMBUAT & MENGIRIM LAPORAN RANGKUMAN tidak berubah)
}

main().catch((error) => {
    console.error("❌ Terjadi error fatal pada skrip utama:", error);
    process.exit(1);
});
