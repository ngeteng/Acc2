// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, ERC721Burnable, Ownable {
    uint256 private _nextTokenId;
    uint256 public immutable maxSupply; // maxSupply sekarang ditentukan saat deploy

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply
    )
        ERC721(name, symbol)
        Ownable(msg.sender)
    {
        maxSupply = _maxSupply;
    }

    function safeMint(address to, string memory uri) public onlyOwner {
        require(_nextTokenId < maxSupply, "All tokens have been minted");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
    
    // Fungsi override yang dibutuhkan untuk mengatasi konflik pewarisan
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
