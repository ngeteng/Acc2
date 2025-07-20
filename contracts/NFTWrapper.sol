// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./WrappedNFT.sol";

contract NFTWrapper is IERC721Receiver {
    // Alamat kontrak NFT asli kita (MyNFT)
    IERC721 public immutable originalNft;
    // Alamat kontrak NFT yang dibungkus (WrappedNFT)
    WrappedNFT public immutable wrappedNft;

    // ... (mapping pelacakan tetap sama)
    mapping(uint256 => uint256) public originalToWrapped;
    mapping(uint256 => uint256) public wrappedToOriginal;

    constructor(address _originalNftAddress, address _wrappedNftAddress) {
        originalNft = IERC721(_originalNftAddress);
        wrappedNft = WrappedNFT(_wrappedNftAddress);
    }

    // FUNGSI UTAMA BARU: Otomatis berjalan saat kontrak ini menerima NFT
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) public override returns (bytes4) {
        // Pastikan NFT yang diterima adalah dari koleksi yang benar
        require(msg.sender == address(originalNft), "NFTWrapper: Invalid NFT collection");

        // Buat WNFT baru dengan ID yang sama untuk pemilik asli (from)
        wrappedNft.mint(from, tokenId);

        // Simpan data pelacakan
        originalToWrapped[tokenId] = tokenId;
        wrappedToOriginal[tokenId] = tokenId;

        // Kembalikan selector untuk menandakan penerimaan berhasil
        return this.onERC721Received.selector;
    }

    // Fungsi unwrap sekarang tidak memerlukan approve juga
    function unwrap(uint256 wrappedTokenId) public {
        // Langsung transfer WNFT dari pengguna ke kontrak ini
        wrappedNft.safeTransferFrom(msg.sender, address(this), wrappedTokenId);

        // Ambil ID token asli yang sesuai
        uint256 originalTokenId = wrappedToOriginal[wrappedTokenId];

        // Bakar WNFT
        wrappedNft.burn(wrappedTokenId);

        // Kirim kembali NFT asli ke pengguna
        originalNft.transferFrom(address(this), msg.sender, originalTokenId);

        // Hapus data pelacakan
        delete originalToWrapped[originalTokenId];
        delete wrappedToOriginal[wrappedTokenId];
    }
}
