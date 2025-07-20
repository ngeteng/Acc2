const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Menggunakan akun:", signer.address);

    // TAHAP 1: DEPLOY SEMUA KONTRAK (tetap sama)
    console.log("\n[1] Mendeploy semua kontrak...");
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNft = await MyNFT.deploy("Chaos NFT", "CHAOS", 1000);
    await myNft.waitForDeployment();
    const myNftAddress = await myNft.getAddress();
    console.log(`  - MyNFT di-deploy di: ${myNftAddress}`);

    const WrappedNFT = await ethers.getContractFactory("WrappedNFT");
    const wrappedNft = await wrappedNft.deploy();
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

    // TAHAP 2: PROSES WRAP (POLA BARU)
    console.log("\n[2] Memulai proses WRAP...");
    console.log("  - Minting MyNFT #0...");
    const txMint = await myNft.safeMint(signer.address, "ipfs://uri/0");
    await txMint.wait();
    console.log(`  - Owner MyNFT #0 adalah: ${await myNft.ownerOf(0)}`);

    console.log("  - Mengirim (push) MyNFT #0 ke Wrapper untuk di-wrap...");
    // Ini adalah satu-satunya panggilan yang dibutuhkan untuk WRAP
    const txWrap = await myNft["safeTransferFrom(address,address,uint256)"](
        signer.address,
        nftWrapperAddress,
        0
    );
    await txWrap.wait();

    console.log(`\n  ✅ PROSES WRAP SELESAI!`);
    console.log(`  - Owner MyNFT #0 sekarang: ${await myNft.ownerOf(0)}`);
    console.log(`  - Owner WrappedNFT #0 sekarang: ${await wrappedNft.ownerOf(0)}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
