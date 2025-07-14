const { ethers, config } = require("hardhat");
const axios = require("axios");
require("dotenv").config();

// =============================================================
// KONFIGURASI
// =============================================================
const targetNetworks = ["Monad", "Pharos", "Somnia", "OG"];

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
  const deploymentResults = []; // Deklarasi yang hilang
  const startTime = new Date();
  
  console.log(`\n🚀 Memulai Bot NFT Canggih ke ${targetNetworks.length} jaringan...`);

  for (const networkName of targetNetworks) {
    console.log(`\n=================================================`);
    console.log(`- Memproses jaringan: ${networkName.toUpperCase()}`);
    console.log(`=================================================`);

    try {
      const provider = new ethers.JsonRpcProvider(config.networks[networkName].url);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      
      const randomName = `AI NFT Collection ${generateRandomString(6)}`;
      const randomSymbol = generateRandomString(4).toUpperCase();
      console.log(`  - Koleksi Dibuat: ${randomName} (${randomSymbol})`);

      // 1. DEPLOY
      console.log("  - [1/3] Mendeploy MyNFT...");
      const nftFactory = await ethers.getContractFactory("MyNFT", signer);
      const nft = await nftFactory.deploy(randomName, randomSymbol);
      await nft.waitForDeployment();
      const nftAddress = await nft.getAddress();
      console.log(`✔  MyNFT ter-deploy di: ${nftAddress}`);

      // 2. MINTING PARALEL
      const mintCount = 5;
      console.log(`  - [2/3] Memulai minting ${mintCount} NFT secara paralel...`);
      const sampleTokenURI = "ipfs://bafkreihg5orwinp5t2bwxp7gsfb24v3cnitu72klbto3dyx7j2x2qg7dnm";
      
      const mintPromises = [];
      for (let i = 0; i < mintCount; i++) {
        const mintPromise = nft.safeMint(signer.address, `${sampleTokenURI}/${i}.json`);
        mintPromises.push(mintPromise);
      }
      const mintTxs = await Promise.all(mintPromises);
      console.log(`  - Menunggu konfirmasi untuk ${mintCount} transaksi mint...`);
      await Promise.all(mintTxs.map(tx => tx.wait()));
      console.log("✔  Semua proses minting selesai.");
      
      // 3. INTERAKSI ACAK
      console.log("  - [3/3] Melakukan interaksi acak...");
      const tokenIdToInteract = 0;
      const randomAction = Math.floor(Math.random() * 3);
      let actionDescription = "";

      switch (randomAction) {
        case 0:
          const randomWallet = ethers.Wallet.createRandom();
          console.log(`    - Aksi dipilih: Mentransfer NFT #${tokenIdToInteract}...`);
          const transferTx = await nft.transferFrom(signer.address, randomWallet.address, tokenIdToInteract);
          await transferTx.wait();
          actionDescription = `Transfer NFT #${tokenIdToInteract} ke ${shortenAddress(randomWallet.address)}`;
          console.log(`    ✔  Transfer berhasil!`);
          break;
        case 1:
          const operatorWallet = ethers.Wallet.createRandom();
          console.log(`    - Aksi dipilih: Approve wallet acak untuk NFT #${tokenIdToInteract}...`);
          const approveTx = await nft.approve(operatorWallet.address, tokenIdToInteract);
          await approveTx.wait();
          actionDescription = `Approve NFT #${tokenIdToInteract} untuk ${shortenAddress(operatorWallet.address)}`;
          console.log(`    ✔  Approve berhasil!`);
          break;
        case 2:
          console.log(`    - Aksi dipilih: Membakar (burn) NFT #${tokenIdToInteract}...`);
          const burnTx = await nft.burn(tokenIdToInteract);
          await burnTx.wait();
          actionDescription = `Burn NFT #${tokenIdToInteract}`;
          console.log(`    ✔  Burn berhasil!`);
          break;
      }
      
      console.log(`✔  Proses di jaringan ${networkName.toUpperCase()} SUKSES.`);
      deploymentResults.push(`✅ *${networkName.toUpperCase()}*: SUKSES!\n  - Koleksi: *${randomName}* \`${shortenAddress(nftAddress)}\`\n  - Aksi: Deploy, Mint 5x & ${actionDescription}`);

    } catch (error) {
      console.error(`❌ Proses GAGAL di jaringan ${networkName.toUpperCase()}:`, error.message);
      deploymentResults.push(`❌ *${networkName.toUpperCase()}*: GAGAL!\n  - Error: \`${error.message.substring(0, 50)}...\``);
    }
  }

  // MEMBUAT & MENGIRIM LAPORAN RANGKUMAN
  console.log("\n=================================================");
  console.log("🏁 Semua proses selesai. Membuat laporan rangkuman...");
  const endTime = new Date();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  let summaryMessage = `*Laporan Rangkuman Bot NFT Canggih*\n\n`;
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
