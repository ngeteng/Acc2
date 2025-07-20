const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Menggunakan akun:", signer.address);

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

    console.log("\n[2] Memulai proses WRAP...");
    console.log("  - Minting MyNFT baru...");
    const txMint = await myNft.safeMint(signer.address, "ipfs://your_uri_here/0");
    const receipt = await txMint.wait();
    
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
      console.log(`  - Token yang dibuat adalah ID #${actualTokenId.toString()}`);
    } else {
      console.error("  - GAGAL: Tidak dapat menemukan event Transfer.");
      return;
    }
    
    console.log(`  - Mengirim MyNFT #${actualTokenId} ke Wrapper untuk di-wrap...`);
    const txWrap = await myNft["safeTransferFrom(address,address,uint256)"](
        signer.address,
        nftWrapperAddress,
        actualTokenId
    );
    await txWrap.wait();

    console.log(`\n  ✅ PROSES WRAP SELESAI!`);
    console.log(`  - Owner MyNFT #${actualTokenId} sekarang: ${await myNft.ownerOf(actualTokenId)}`);
    console.log(`  - Owner WrappedNFT #${actualTokenId} sekarang: ${await wrappedNft.ownerOf(actualTokenId)}`);
    
    console.log("\n[3] Memulai proses UNWRAP...");
    const txUnwrap = await nftWrapper.unwrap(actualTokenId);
    await txUnwrap.wait();
    
    console.log(`\n  ✅ PROSES UNWRAP SELESAI!`);
    console.log(`  - Owner MyNFT #${actualTokenId} sekarang: ${await myNft.ownerOf(actualTokenId)}`);
    try {
        await wrappedNft.ownerOf(actualTokenId);
    } catch (error) {
        console.log(`  - Status WrappedNFT #${actualTokenId}: Sudah dibakar.`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
