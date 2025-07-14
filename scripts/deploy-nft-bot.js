const { ethers, config } = require("hardhat");
const axios = require("axios");
require("dotenv").config();

// =============================================================
// KONFIGURASI
// =============================================================
const targetNetworks = ["Pharos", "Somnia", "OG"];

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
  
  console.log(`\n🚀 Memulai Bot NFT Super Canggih ke ${targetNetworks.length} jaringan...`);

  for (const networkName of targetNetworks) {
    console.log(`\n=================================================`);
    console.log(`- Memproses jaringan: ${networkName.toUpperCase()}`);
    console.log(`=================================================`);

    try {
      const provider = new ethers.JsonRpcProvider(config.networks[networkName].url);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      
      const randomName = `NFT ${generateRandomString(6)}`;
      const randomSymbol = generateRandomString(4).toUpperCase();
      console.log(`  - Koleksi Dibuat: ${randomName} (${randomSymbol})`);

      // 1. DEPLOY KONTRAK NFT
      console.log("  - [1/5] Mendeploy MyNFT...");
      const nftFactory = await ethers.getContractFactory("MyNFT", signer);
      const nft = await nftFactory.deploy(randomName, randomSymbol);
      await nft.waitForDeployment();
      const nftAddress = await nft.getAddress();
      console.log(`✔  MyNFT ter-deploy di: ${nftAddress}`);

      // 2. MINTING NFT
      const mintCount = 5;
      console.log(`  - [2/5] Memulai minting ${mintCount} NFT...`);
      const sampleTokenURI = "ipfs://bafkreihg5orwinp5t2bwxp7gsfb24v3cnitu72klbto3dyx7j2x2qg7dnm";
      for (let i = 0; i < mintCount; i++) {
        const mintTx = await nft.safeMint(signer.address, `${sampleTokenURI}/${i}.json`);
        await mintTx.wait();
      }
      console.log("✔  Proses minting selesai.");
      
      // 3. DEPLOY KONTRAK STAKING VAULT
      console.log("  - [3/5] Mendeploy NFTStakingVault...");
      const vaultFactory = await ethers.getContractFactory("NFTStakingVault", signer);
      const vault = await vaultFactory.deploy(nftAddress);
      await vault.waitForDeployment();
      const vaultAddress = await vault.getAddress();
      console.log(`✔  NFTStakingVault ter-deploy di: ${vaultAddress}`);

      // 4. STAKE SATU NFT
      console.log("  - [4/5] Melakukan Staking NFT #0...");
      const tokenIdToStake = 0;
      const approveTx = await nft.approve(vaultAddress, tokenIdToStake);
      await approveTx.wait();
      const stakeTx = await vault.stake(tokenIdToStake);
      await stakeTx.wait();
      console.log("✔  Staking berhasil!");

      // 5. INTERAKSI ACAK TAMBAHAN
      console.log("  - [5/5] Melakukan interaksi acak tambahan...");
      const tokenIdToInteract = 1; // Menggunakan NFT #1 yang tidak di-stake
      const randomAction = Math.floor(Math.random() * 2); // Acak antara 0 atau 1
      let finalActionDescription = "";

      if (randomAction === 0) {
        // AKSI: TRANSFER
        const randomWallet = ethers.Wallet.createRandom();
        console.log(`    - Aksi dipilih: Mentransfer NFT #${tokenIdToInteract}...`);
        const transferTx = await nft.transferFrom(signer.address, randomWallet.address, tokenIdToInteract);
        await transferTx.wait();
        finalActionDescription = `Transfer NFT #${tokenIdToInteract}`;
        console.log(`    ✔  Transfer berhasil!`);
      } else {
        // AKSI: BURN
        console.log(`    - Aksi dipilih: Membakar (burn) NFT #${tokenIdToInteract}...`);
        const burnTx = await nft.burn(tokenIdToInteract);
        await burnTx.wait();
        finalActionDescription = `Burn NFT #${tokenIdToInteract}`;
        console.log(`    ✔  Burn berhasil!`);
      }
      
      const actionDescription = `Deploy, Mint, Stake & ${finalActionDescription}`;
      console.log(`✔  Proses di jaringan ${networkName.toUpperCase()} SUKSES.`);
      deploymentResults.push(`✅ *${networkName.toUpperCase()}*: SUKSES!\n  - Koleksi: *${randomName}* \`${shortenAddress(nftAddress)}\`\n  - Aksi: ${actionDescription}`);

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

  let summaryMessage = `*Laporan Rangkuman Bot Super Canggih*\n\n`;
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
