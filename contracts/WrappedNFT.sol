// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WrappedNFT is ERC721Burnable, Ownable {
    address public wrapperContract;

    constructor() ERC721("Wrapped Chaos NFT", "WCNFT") Ownable(msg.sender) {}

    function setWrapper(address _wrapperAddress) public onlyOwner {
        wrapperContract = _wrapperAddress;
    }

    function mint(address to, uint256 tokenId) public {
        require(msg.sender == wrapperContract, "Only wrapper can mint");
        _safeMint(to, tokenId);
    }

    function burn(uint256 tokenId) public override {
        require(msg.sender == wrapperContract, "Only wrapper can burn");
        _burn(tokenId);
    }
}
