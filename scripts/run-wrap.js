const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Menggunakan akun:", signer.address);

    // ========================================================
    // TAHAP 1: DEPLOY SEMUA KONTRAK
    // ========================================================
    console.log("\n[1] Mendeploy semua kontrak...");

    // Deploy MyNFT (dari skrip Anda sebelumnya)
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNft = await MyNFT.deploy("NFT", "CHAOS", 1000);
    await myNft.waitForDeployment();
    const myNftAddress = await myNft.getAddress();
    console.log(`  - MyNFT di-deploy di: ${myNftAddress}`);

    // Deploy WrappedNFT
    const WrappedNFT = await ethers.getContractFactory("WrappedNFT");
    const wrappedNft = await WrappedNFT.deploy();
    await wrappedNft.waitForDeployment();
    const wrappedNftAddress = await wrappedNft.getAddress();
    console.log(`  - WrappedNFT di-deploy di: ${wrappedNftAddress}`);

    // Deploy NFTWrapper
    const NFTWrapper = await ethers.getContractFactory("NFTWrapper");
    const nftWrapper = await NFTWrapper.deploy(myNftAddress, wrappedNftAddress);
    await nftWrapper.waitForDeployment();
    const nftWrapperAddress = await nftWrapper.getAddress();
    console.log(`  - NFTWrapper di-deploy di: ${nftWrapperAddress}`);

    // Konfigurasi penting: Beri tahu WrappedNFT siapa wrappernya
    const txSet = await wrappedNft.setWrapper(nftWrapperAddress);
    await txSet.wait();
    console.log("  - Konfigurasi Wrapper di WrappedNFT selesai.");

    // ========================================================
    // TAHAP 2: PROSES WRAP
    // ========================================================
    console.log("\n[2] Memulai proses WRAP...");

    // Mint NFT asli #77 untuk di-wrap
    const MINT_ID = 77;
    console.log(`  - Minting MyNFT #${MINT_ID}...`);
    const txMint = await myNft.safeMint(signer.address, `ipfs://.../${MINT_ID}`);
    await txMint.wait();
    console.log(`  - Owner MyNFT #${MINT_ID} adalah: ${await myNft.ownerOf(MINT_ID)}`);

    // Beri izin ke wrapper
    console.log(`  - Memberikan izin (approve) kepada Wrapper...`);
    const txApprove = await myNft.approve(nftWrapperAddress, MINT_ID);
    await txApprove.wait();

    // Lakukan wrap
    console.log(`  - Memanggil fungsi wrap(${MINT_ID})...`);
    const txWrap = await nftWrapper.wrap(MINT_ID);
    await txWrap.wait();

    console.log(`\n  ✅ PROSES WRAP SELESAI!`);
    console.log(`  - Owner MyNFT #${MINT_ID} sekarang: ${await myNft.ownerOf(MINT_ID)} (Kontrak Wrapper)`);
    console.log(`  - Owner WrappedNFT #${MINT_ID} sekarang: ${await wrappedNft.ownerOf(MINT_ID)} (Anda)`);


    // ========================================================
    // TAHAP 3: PROSES UNWRAP
    // ========================================================
    console.log("\n[3] Memulai proses UNWRAP...");

    // Beri izin WNFT ke wrapper
    console.log(`  - Memberikan izin (approve) WrappedNFT kepada Wrapper...`);
    const txApproveWNFT = await wrappedNft.approve(nftWrapperAddress, MINT_ID);
    await txApproveWNFT.wait();

    // Lakukan unwrap
    console.log(`  - Memanggil fungsi unwrap(${MINT_ID})...`);
    const txUnwrap = await nftWrapper.unwrap(MINT_ID);
    await txUnwrap.wait();
    
    console.log(`\n  ✅ PROSES UNWRAP SELESAI!`);
    console.log(`  - Owner MyNFT #${MINT_ID} sekarang: ${await myNft.ownerOf(MINT_ID)} (Anda)`);
    try {
        await wrappedNft.ownerOf(MINT_ID);
    } catch (error) {
        console.log(`  - Status WrappedNFT #${MINT_ID}: Sudah dibakar (tidak ada pemilik).`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
