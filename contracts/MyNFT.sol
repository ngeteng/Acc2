// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    // Saat deploy, kita beri nama dan simbol untuk koleksi NFT
    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
        Ownable(msg.sender) // Set pemilik kontrak adalah yang mendeploy
    {}

    // Fungsi untuk membuat (mint) NFT baru
    // Hanya pemilik kontrak yang bisa memanggil fungsi ini
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
