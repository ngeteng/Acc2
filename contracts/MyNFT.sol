// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol"; // IMPORT MODUL BURNABLE
import "@openzeppelin/contracts/access/Ownable.sol";

// TAMBAHKAN ERC721Burnable PADA WARISAN KONTRAK
contract MyNFT is ERC721URIStorage, Ownable, ERC721Burnable {
    uint256 private _nextTokenId;

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
        Ownable(msg.sender)
    {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
    
    // Kita tidak perlu menulis fungsi burn secara manual,
    // karena sudah disediakan oleh ERC721Burnable.
    // Pemilik NFT bisa memanggil fungsi `burn(tokenId)`.
}
