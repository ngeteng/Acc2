// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, ERC721Burnable, Ownable {
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
    
    // ==================================================================
    // **BAGIAN PERBAIKAN:** Menambahkan fungsi override di bawah ini
    // ==================================================================

    // Override untuk mengatasi konflik `tokenURI`
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage) // Cukup override satu, yang paling spesifik
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // Override untuk mengatasi konflik `supportsInterface`
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Burnable) // Sebutkan kedua parent yang konflik
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
