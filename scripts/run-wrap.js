const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Menggunakan akun:", signer.address);

    // ========================================================
    // TAHAP 1: DEPLOY SEMUA KONTRAK
    // ========================================================
    console.log("\n[1] Mendeploy semua kontrak...");

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNft = await MyNFT.deploy("Chaos NFT", "CHAOS", 1000);
    await myNft.waitForDeployment();
    const myNftAddress = await myNft.getAddress();
    console.log(`  - MyNFT di-deploy di: ${myNftAddress}`);

    const WrappedNFT = await ethers.getContractFactory("WrappedNFT");
    const wrappedNft = await WrappedNFT.deploy();
    await wrappedNft.waitForDeployment();
    const wrappedNftAddress = await wrappedNft.getAddress();
    console.log(`  - WrappedNFT di-deploy di: ${wrappedNftAddress}`);

    const NFTWrapper = await ethers.getContractFactory("NFTWrapper");
    const nftWrapper = await NFTWrapper.deploy(myNftAddress, wrappedNftAddress);
    await nftWrapper.waitForDeployment();
    const nftWrapperAddress = await nftWrapper.getAddress();
    console.log(`  - NFTWrapper di-deploy di: ${nftWrapperAddress}`);

    const txSet = await wrappedNft.setWrapper(nftWrapperAddress);
    await txSet.wait();
    console.log("  - Konfigurasi Wrapper di WrappedNFT selesai.");

    // ========================================================
    // TAHAP 2: PROSES WRAP (VERSI PINTAR)
    // ========================================================
    console.log("\n[2] Memulai proses WRAP...");

    console.log(`  - Minting MyNFT baru...`);
    const txMint = await myNft.safeMint(signer.address, `ipfs://.../new`);
    const receipt = await txMint.wait();

    // --- BAGIAN BARU & PENTING ---
    // Cari event 'Transfer' untuk mendapatkan ID token yang sebenarnya
    let actualTokenId;
    const transferEvent = receipt.logs.find(log => {
      try {
        const parsedLog = myNft.interface.parseLog(log);
        return parsedLog.name === "Transfer";
      } catch (error) {
        return false;
      }
    });

    if (transferEvent) {
      actualTokenId = transferEvent.args.tokenId;
      console.log(`  - Token yang sebenarnya dibuat adalah ID #${actualTokenId.toString()}`);
    } else {
      console.error("  - GAGAL: Tidak dapat menemukan event Transfer setelah minting.");
      return;
    }
    // --- AKHIR BAGIAN BARU ---
    
    console.log(`  - Owner MyNFT #${actualTokenId} adalah: ${await myNft.ownerOf(actualTokenId)}`);

    console.log(`  - Memberikan izin (approve) kepada Wrapper...`);
    const txApprove = await myNft.approve(nftWrapperAddress, actualTokenId);
    await txApprove.wait();

    console.log(`  - Memanggil fungsi wrap(${actualTokenId})...`);
    const txWrap = await nftWrapper.wrap(actualTokenId);
    await txWrap.wait();

    console.log(`\n  ✅ PROSES WRAP SELESAI!`);
    console.log(`  - Owner MyNFT #${actualTokenId} sekarang: ${await myNft.ownerOf(actualTokenId)}`);
    console.log(`  - Owner WrappedNFT #${actualTokenId} sekarang: ${await wrappedNft.ownerOf(actualTokenId)}`);

    // ... (Anda bisa tambahkan logika unwrap di sini jika mau)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
