// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Cukup import ERC721URIStorage, karena dia sudah meng-import ERC721
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// 1. STRUKTUR WARISAN YANG LEBIH SEDERHANA
contract MyNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol) // Tetap memanggil constructor ERC721
        Ownable(msg.sender)
    {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri); // Fungsi ini akan bekerja karena diwarisi dari ERC721URIStorage
    }
    
    // 2. SEMUA FUNGSI OVERRIDE DIHAPUS
    // Kita tidak perlu lagi _burn() atau tokenURI() di sini
    // karena tidak ada konflik antar parent contract.
}
