const { ethers, config } = require("hardhat");
const axios = require("axios");
require("dotenv").config();

// =============================================================
// KONFIGURASI
// =============================================================
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
// FUNGSI HELPER
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
  
  console.log(`\n🚀 Memulai Bot Ultimate Final ke ${targetNetworks.length} jaringan...`);

  for (const networkName of targetNetworks) {
    console.log(`\n=================================================`);
    console.log(`- Memproses jaringan: ${networkName.toUpperCase()}`);
    console.log(`=================================================`);

    try {
      if (!config.networks[networkName] || !config.networks[networkName].url) {
        throw new Error(`Konfigurasi jaringan untuk '${networkName}' tidak ditemukan di hardhat.config.js`);
      }
        
      const provider = new ethers.JsonRpcProvider(config.networks[networkName].url);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      
      const randomName = `NFT ${generateRandomString(6)}`;
      const randomSymbol = generateRandomString(4).toUpperCase();
      console.log(`  - Koleksi Dibuat: ${randomName} (${randomSymbol})`);

      // Tahap 1: Deploy NFT
      console.log("  - [1/6] Mendeploy MyNFT...");
      const nftFactory = await ethers.getContractFactory("MyNFT", signer);
      const nft = await nftFactory.deploy(randomName, randomSymbol);
      await nft.waitForDeployment();
      const nftAddress = await nft.getAddress();
      console.log(`✔  MyNFT ter-deploy di: ${nftAddress}`);

      // Tahap 2: Minting dengan Log Detail
      console.log(`  - [2/6] Memulai minting 5 NFT...`);
      const sampleTokenURI = "ipfs://bafkreihg5orwinp5t2bwxp7gsfb24v3cnitu72klbto3dyx7j2x2qg7dnm";
      for (let i = 0; i < 5; i++) {
        console.log(`    - Memproses mint untuk NFT ID ${i}...`);
        const mintTx = await nft.safeMint(signer.address, `${sampleTokenURI}/${i}.json`);
        console.log(`      ┖ Tx Hash: ${mintTx.hash}`);
        await mintTx.wait();
      }
      console.log("✔  Proses minting selesai.");
      
      // Tahap 3: Deploy Vault
      console.log("  - [3/6] Mendeploy NFTStakingVault...");
      const vaultFactory = await ethers.getContractFactory("NFTStakingVault", signer);
      const vault = await vaultFactory.deploy(nftAddress);
      await vault.waitForDeployment();
      const vaultAddress = await vault.getAddress();
      console.log(`✔  NFTStakingVault ter-deploy di: ${vaultAddress}`);

      // Tahap 4: Staking
      console.log("  - [4/6] Melakukan Staking NFT #0...");
      const approveTx_stake = await nft.approve(vaultAddress, 0);
      await approveTx_stake.wait();
      const stakeTx = await vault.stake(0);
      await stakeTx.wait();
      console.log("✔  Staking berhasil!");

      // Tahap 5: Interaksi Wajib - Approve
      console.log("  - [5/6] Melakukan interaksi wajib: Approve...");
      const operatorWallet = ethers.Wallet.createRandom();
      const tokenIdToApprove = 1;
      console.log(`    - Aksi: Approve NFT #${tokenIdToApprove} untuk wallet ${shortenAddress(operatorWallet.address)}...`);
      const approveTx = await nft.approve(operatorWallet.address, tokenIdToApprove);
      await approveTx.wait();
      console.log(`    ✔  Approve berhasil!`);

      // Tahap 6: Interaksi Acak Tambahan
      console.log("  - [6/6] Melakukan interaksi acak tambahan...");
      const tokenIdForRandomAction = 2; // Menggunakan NFT #2 yang belum diapa-apakan
      const randomAction = Math.floor(Math.random() * 2); // Acak antara 0 atau 1
      let randomActionDescription = "";

      if (randomAction === 0) {
        // AKSI: TRANSFER
        const randomWallet = ethers.Wallet.createRandom();
        console.log(`    - Aksi dipilih: Mentransfer NFT #${tokenIdForRandomAction}...`);
        const transferTx = await nft.transferFrom(signer.address, randomWallet.address, tokenIdForRandomAction);
        await transferTx.wait();
        randomActionDescription = `Transfer NFT #${tokenIdForRandomAction}`;
        console.log(`    ✔  Transfer berhasil!`);
      } else {
        // AKSI: BURN
        console.log(`    - Aksi dipilih: Membakar (burn) NFT #${tokenIdForRandomAction}...`);
        const burnTx = await nft.burn(tokenIdForRandomAction);
        await burnTx.wait();
        randomActionDescription = `Burn NFT #${tokenIdForRandomAction}`;
        console.log(`    ✔  Burn berhasil!`);
      }
      
      const actionDescription = `Deploy, Mint, Stake, Approve & ${randomActionDescription}`;
      console.log(`✔  Proses di jaringan ${networkName.toUpperCase()} SUKSES.`);
      deploymentResults.push(`✅ *${networkName.toUpperCase()}*: SUKSES!\n  - Aksi: ${actionDescription}\n  - NFT: \`${nftAddress}\``);

    } catch (error) {
      console.error(`❌ Proses GAGAL di jaringan ${networkName.toUpperCase()}:`, error.message);
      deploymentResults.push(`❌ *${networkName.toUpperCase()}*: GAGAL!`);
    }
  }

  // MEMBUAT & MENGIRIM LAPORAN RANGKUMAN
  console.log("\n=================================================");
  console.log("🏁 Semua proses selesai. Membuat laporan rangkuman...");
  const endTime = new Date();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  let summaryMessage = `*Laporan Rangkuman Bot Final*\n\n`;
  summaryMessage += `*Durasi Total*: ${duration} detik\n\n`;
  summaryMessage += `*Hasil Per Jaringan:*\n`;
  summaryMessage += deploymentResults.join('\n\n');

  await sendMessage(summaryMessage);
  console.log("Laporan rangkuman akhir telah dikirim ke Telegram.");
}

main().catch((error) => {
    console.error("❌ Terjadi error fatal pada skrip utama:", error);
    process.exit(1);
});
