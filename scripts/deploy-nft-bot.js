const { ethers, config } = require("hardhat");
const axios = require("axios");
require("dotenv").config();

// ... (Bagian KONFIGURASI, LAPORAN TELEGRAM, dan FUNGSI HELPER tidak berubah, salin dari skrip lama)

// =============================================================
// SCRIPT UTAMA (VERSI 2.0)
// =============================================================
async function main() {
  // ... (Bagian inisialisasi awal tidak berubah)
  
  console.log(`\n🚀 Memulai Bot NFT Canggih ke ${targetNetworks.length} jaringan...`);

  for (const networkName of targetNetworks) {
    // ... (Bagian log awal per jaringan tidak berubah)

    try {
      const provider = new ethers.JsonRpcProvider(config.networks[networkName].url);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      
      const randomName = `AI NFT Collection ${generateRandomString(6)}`;
      const randomSymbol = generateRandomString(4).toUpperCase();
      console.log(`  - Koleksi Dibuat: ${randomName} (${randomSymbol})`);

      // 1. DEPLOY KONTRAK NFT
      console.log("  - [1/3] Mendeploy MyNFT...");
      const nftFactory = await ethers.getContractFactory("MyNFT", signer);
      const nft = await nftFactory.deploy(randomName, randomSymbol);
      await nft.waitForDeployment();
      const nftAddress = await nft.getAddress();
      console.log(`✔  MyNFT ter-deploy di: ${nftAddress}`);

      // 2. MINTING PARALEL & EFISIEN
      const mintCount = 5;
      console.log(`  - [2/3] Memulai minting ${mintCount} NFT secara paralel...`);
      const sampleTokenURI = "ipfs://bafkreihg5orwinp5t2bwxp7gsfb24v3cnitu72klbto3dyx7j2x2qg7dnm";
      
      const mintPromises = [];
      for (let i = 0; i < mintCount; i++) {
        // Kirim transaksi tanpa menunggu, simpan 'promise' nya
        const mintPromise = nft.safeMint(signer.address, `${sampleTokenURI}/${i}.json`);
        mintPromises.push(mintPromise);
        console.log(`    - Transaksi mint #${i + 1} dikirim...`);
      }
      
      // Tunggu semua promise transaksi selesai
      const mintTxs = await Promise.all(mintPromises);
      console.log(`  - Menunggu konfirmasi untuk ${mintCount} transaksi mint...`);
      
      // Tunggu konfirmasi untuk setiap transaksi
      const receiptPromises = mintTxs.map(tx => tx.wait());
      await Promise.all(receiptPromises);
      console.log("✔  Semua proses minting selesai dan terkonfirmasi.");
      
      // 3. INTERAKSI ACAK
      console.log("  - [3/3] Melakukan interaksi acak...");
      const tokenIdToInteract = 0; // Kita akan berinteraksi dengan NFT pertama (ID 0)
      const randomAction = Math.floor(Math.random() * 3); // Menghasilkan angka 0, 1, atau 2
      let actionDescription = "";

      switch (randomAction) {
        case 0:
          // AKSI 1: TRANSFER
          const randomWallet = ethers.Wallet.createRandom();
          console.log(`    - Aksi dipilih: Mentransfer NFT #${tokenIdToInteract} ke wallet acak...`);
          const transferTx = await nft.transferFrom(signer.address, randomWallet.address, tokenIdToInteract);
          await transferTx.wait();
          actionDescription = `Transfer NFT #${tokenIdToInteract} ke ${shortenAddress(randomWallet.address)}`;
          console.log(`    ✔  Transfer berhasil!`);
          break;
        case 1:
          // AKSI 2: APPROVE
          const operatorWallet = ethers.Wallet.createRandom();
          console.log(`    - Aksi dipilih: Approve wallet acak untuk NFT #${tokenIdToInteract}...`);
          const approveTx = await nft.approve(operatorWallet.address, tokenIdToInteract);
          await approveTx.wait();
          actionDescription = `Approve NFT #${tokenIdToInteract} untuk ${shortenAddress(operatorWallet.address)}`;
          console.log(`    ✔  Approve berhasil!`);
          break;
        case 2:
          // AKSI 3: BURN
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

  // ... (Bagian MEMBUAT & MENGIRIM LAPORAN RANGKUMAN tidak berubah)
}

main().catch((error) => {
    console.error("❌ Terjadi error fatal pada skrip utama:", error);
    process.exit(1);
});
