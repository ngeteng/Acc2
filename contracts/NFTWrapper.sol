// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./WrappedNFT.sol";

contract NFTWrapper {
    IERC721 public immutable originalNft;
    WrappedNFT public immutable wrappedNft;

    mapping(uint256 => uint256) public originalToWrapped;
    // Melacak pasangan ID token: wrappedId => originalId
    mapping(uint256 => uint256) public wrappedToOriginal;

    constructor(address _originalNftAddress, address _wrappedNftAddress) {
        originalNft = IERC721(_originalNftAddress);
        wrappedNft = WrappedNFT(_wrappedNftAddress);
    }

    // Fungsi untuk membungkus NFT asli
    function wrap(uint256 originalTokenId) public {
        require(originalNft.isApprovedForAll(msg.sender, address(this)), "NFTWrapper: Approval for all not given");
        originalNft.safeTransferFrom(msg.sender, address(this), originalTokenId);

        // Buat WNFT baru dengan ID yang sama untuk pengguna
        wrappedNft.mint(msg.sender, originalTokenId);

        // Simpan data pelacakan
        originalToWrapped[originalTokenId] = originalTokenId;
        wrappedToOriginal[originalTokenId] = originalTokenId;
    }

    // Fungsi untuk membuka kembali NFT asli
    function unwrap(uint256 wrappedTokenId) public {
        // Pastikan pengguna adalah pemilik WNFT
        require(wrappedNft.ownerOf(wrappedTokenId) == msg.sender, "Not owner of wrapped token");

        // Ambil ID token asli yang sesuai
        uint256 originalTokenId = wrappedToOriginal[wrappedTokenId];

        // Bakar WNFT dari kepemilikan pengguna
        wrappedNft.burn(wrappedTokenId);

        // Kirim kembali NFT asli ke pengguna
        originalNft.safeTransferFrom(address(this), msg.sender, originalTokenId);

        // Hapus data pelacakan
        delete originalToWrapped[originalTokenId];
        delete wrappedToOriginal[wrappedTokenId];
    }
}
