// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTStakingVault {
    IERC721 public immutable nftContract;
    mapping(uint256 => address) public stakers;

    constructor(address _nftAddress) {
        nftContract = IERC721(_nftAddress);
    }

    function stake(uint256 tokenId) public {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");
        
        stakers[tokenId] = msg.sender;
        
        // Vault mengambil alih kepemilikan NFT
        nftContract.transferFrom(msg.sender, address(this), tokenId);
    }
}
