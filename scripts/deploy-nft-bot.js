const { ethers, config, run } = require("hardhat"); // Tambahkan 'run' untuk memanggil task hardhat
const axios = require("axios");
require("dotenv").config();

// ... (Bagian KONFIGURASI, LAPORAN TELEGRAM, dan FUNGSI HELPER tidak berubah) ...
// NOTE: Ubah array targetNetworks agar namanya sama persis dengan di hardhat.config.js
const targetNetworks = ["somnia-testnet"];

async function main() {
  const deploymentResults = [];
  const startTime = new Date();
  
  console.log(`\n🚀 Memulai Bot Ultimate (Deploy, Stake & Auto-Verify) ke ${targetNetworks.length} jaringan...`);

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

      // Tahap 1-4: Deploy, Mint, Deploy Vault, Stake (tidak berubah)
      console.log("  - [1/5] Mendeploy MyNFT...");
      const nftFactory = await ethers.getContractFactory("MyNFT", signer);
      const nft = await nftFactory.deploy(randomName, randomSymbol);
      await nft.waitForDeployment();
      const nftAddress = await nft.getAddress();
      console.log(`✔  MyNFT ter-deploy di: ${nftAddress}`);

      console.log(`  - [2/5] Memulai minting 5 NFT...`);
      const sampleTokenURI = "ipfs://bafkreihg5orwinp5t2bwxp7gsfb24v3cnitu72klbto3dyx7j2x2qg7dnm";
      for (let i = 0; i < 5; i++) {
        const mintTx = await nft.safeMint(signer.address, `${sampleTokenURI}/${i}.json`);
        await mintTx.wait();
      }
      console.log("✔  Proses minting selesai.");
      
      console.log("  - [3/5] Mendeploy NFTStakingVault...");
      const vaultFactory = await ethers.getContractFactory("NFTStakingVault", signer);
      const vault = await vaultFactory.deploy(nftAddress);
      await vault.waitForDeployment();
      const vaultAddress = await vault.getAddress();
      console.log(`✔  NFTStakingVault ter-deploy di: ${vaultAddress}`);

      console.log("  - [4/5] Melakukan Staking NFT #0...");
      const approveTx = await nft.approve(vaultAddress, 0);
      await approveTx.wait();
      const stakeTx = await vault.stake(0);
      await stakeTx.wait();
      console.log("✔  Staking berhasil!");

      // =============================================================
      // TAHAP 5: VERIFIKASI OTOMATIS
      // =============================================================
      console.log("  - [5/5] Mencoba verifikasi otomatis...");
      
      // Cek apakah konfigurasi verifikasi ada untuk jaringan ini
      const customChain = config.etherscan.customChains.find(chain => chain.network === networkName);

      if (customChain) {
        console.log(`    - Konfigurasi verifikasi untuk ${networkName} ditemukan. Menjalankan...`);
        try {
          // Jeda singkat sebelum verifikasi untuk memberi waktu explorer mengindeks kontrak
          await new Promise(resolve => setTimeout(resolve, 30000)); // Jeda 30 detik

          // Verifikasi Kontrak NFT
          await run("verify:verify", {
            address: nftAddress,
            constructorArguments: [randomName, randomSymbol],
          });
          console.log(`    ✔  Kontrak NFT di ${nftAddress} berhasil diverifikasi.`);
          
          // Verifikasi Kontrak Vault
          await run("verify:verify", {
            address: vaultAddress,
            constructorArguments: [nftAddress],
          });
          console.log(`    ✔  Kontrak Vault di ${vaultAddress} berhasil diverifikasi.`);

        } catch (verifyError) {
          console.warn(`    ⚠  Verifikasi otomatis gagal: ${verifyError.message}`);
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
