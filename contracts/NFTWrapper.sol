// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./WrappedNFT.sol";

contract NFTWrapper is IERC721Receiver {
    IERC721 public immutable originalNft;
    WrappedNFT public immutable wrappedNft;

    mapping(uint256 => uint256) public originalToWrapped;
    mapping(uint256 => uint256) public wrappedToOriginal;

    constructor(address _originalNftAddress, address _wrappedNftAddress) {
        originalNft = IERC721(_originalNftAddress);
        wrappedNft = WrappedNFT(_wrappedNftAddress);
    }

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes memory
    ) public override returns (bytes4) {
        require(msg.sender == address(originalNft), "Invalid NFT collection");

        wrappedNft.mint(from, tokenId);

        originalToWrapped[tokenId] = tokenId;
        wrappedToOriginal[tokenId] = tokenId;

        return this.onERC721Received.selector;
    }

    function unwrap(uint256 wrappedTokenId) public {
        require(wrappedNft.ownerOf(wrappedTokenId) == msg.sender, "Not owner");
        
        uint256 originalTokenId = wrappedToOriginal[wrappedTokenId];

        wrappedNft.transferFrom(msg.sender, address(this), wrappedTokenId);
        wrappedNft.burn(wrappedTokenId);

        originalNft.transferFrom(address(this), msg.sender, originalTokenId);

        delete originalToWrapped[originalTokenId];
        delete wrappedToOriginal[wrappedTokenId];
    }
}
