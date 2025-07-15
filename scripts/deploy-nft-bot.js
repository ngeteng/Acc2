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

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =============================================================
// SCRIPT UTAMA
// =============================================================
async function main() {
  const deploymentResults = [];
  const startTime = new Date();
  
  console.log(`\n🚀 Memulai Bot 'Master of Chaos' ke ${targetNetworks.length} jaringan...`);

  for (const networkName of targetNetworks) {
    console.log(`\n=================================================`);
    console.log(`- Memproses jaringan: ${networkName.toUpperCase()}`);
    console.log(`=================================================`);

    try {
      if (!config.networks[networkName] || !config.networks[networkName].url) {
        throw new Error(`Konfigurasi jaringan untuk '${networkName}' tidak ditemukan.`);
      }
        
      const provider = new ethers.JsonRpcProvider(config.networks[networkName].url);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      
      const randomName = `NFT ${generateRandomString(6)}`;
      const randomSymbol = generateRandomString(4).toUpperCase();
      const randomMaxSupply = generateRandomNumber(500, 2000);
      console.log(`  - Koleksi Dibuat: ${randomName} (${randomSymbol}) dengan Max Supply: ${randomMaxSupply}`);

      // Tahap 1: Deploy NFT dengan Max Supply Acak
      console.log("  - [1/5] Mendeploy MyNFT...");
      const nftFactory = await ethers.getContractFactory("MyNFT", signer);
      const nft = await nftFactory.deploy(randomName, randomSymbol, randomMaxSupply);
      await nft.waitForDeployment();
      const nftAddress = await nft.getAddress();
      console.log(`✔  MyNFT ter-deploy di: ${nftAddress}`);

      // Tahap 2: Minting dengan Jumlah Acak
      const randomMintCount = generateRandomNumber(2, 5);
      console.log(`  - [2/5] Memulai minting ${randomMintCount} NFT...`);
      const sampleTokenURI = "ipfs://QmWiQE65tmpYzcokf8R3eSg5i2e24Dhr5Ka2u1terGSS26/";
      for (let i = 0; i < randomMintCount; i++) {
        console.log(`    - Memproses mint untuk NFT ID ${i}...`);
        const mintTx = await nft.safeMint(signer.address, `${sampleTokenURI}${i}`);
        await mintTx.wait();
      }
      console.log(`✔  Proses minting ${randomMintCount} NFT selesai.`);
      
      // Tahap 3 & 4: Deploy Vault & Staking
      console.log("  - [3/5] Mendeploy NFTStakingVault...");
      const vaultFactory = await ethers.getContractFactory("NFTStakingVault", signer);
      const vault = await vaultFactory.deploy(nftAddress);
      await vault.waitForDeployment();
      const vaultAddress = await vault.getAddress();
      console.log(`✔  NFTStakingVault ter-deploy di: ${vaultAddress}`);

      console.log("  - [4/5] Melakukan Staking NFT #0...");
      const approveTx_stake = await nft.approve(vaultAddress, 0);
      await approveTx_stake.wait();
      const stakeTx = await vault.stake(0);
      await stakeTx.wait();
      console.log("✔  Staking berhasil!");

      // Tahap 5: Interaksi Acak (Multi-Burn atau Multi-Transfer)
      console.log("  - [5/5] Melakukan interaksi acak tambahan...");
      const randomAction = Math.floor(Math.random() * 2);
      let finalActionDescription = "";
      const availableTokens = randomMintCount - 1;

      if (randomAction === 0 && availableTokens > 0) {
        // AKSI: TRANSFER ACAK (2-5, tapi tidak lebih dari yang tersedia)
        const transferCount = Math.min(generateRandomNumber(2, 5), availableTokens);
        console.log(`    - Aksi dipilih: Mentransfer ${transferCount} NFT...`);
        for (let i = 0; i < transferCount; i++) {
          const tokenId = i + 1; // Mulai dari token ID 1
          const randomWallet = ethers.Wallet.createRandom();
          const transferTx = await nft.transferFrom(signer.address, randomWallet.address, tokenId);
          await transferTx.wait();
        }
        finalActionDescription = `Transfer ${transferCount} NFT`;
        console.log(`    ✔  Transfer berhasil!`);

      } else if (availableTokens > 0) {
        // AKSI: BURN ACAK (1-3, tapi tidak lebih dari yang tersedia)
        const burnCount = Math.min(generateRandomNumber(1, 3), availableTokens);
        console.log(`    - Aksi dipilih: Membakar ${burnCount} NFT...`);
        for (let i = 0; i < burnCount; i++) {
          const tokenId = i + 1; // Mulai dari token ID 1
          const burnTx = await nft.burn(tokenId);
          await burnTx.wait();
        }
        finalActionDescription = `Burn ${burnCount} NFT`;
        console.log(`    ✔  Burn berhasil!`);
        
      } else {
        finalActionDescription = "Tidak ada aksi tambahan";
        console.log(`    - Aksi dilewati: Tidak ada token yang tersedia untuk interaksi.`);
      }
      
      const actionDescription = `Deploy, Mint ${randomMintCount}x, Stake & ${finalActionDescription}`;
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

  let summaryMessage = `*Laporan Rangkuman Bot Master of Chaos*\n\n`;
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
