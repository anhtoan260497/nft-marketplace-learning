// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721 {
    string public constant TOKEN_URI = "https://ipfs.io/ipfs/QmeR3AmLvRFcbHnoAX6XNzs7heMWmPhMSjjtf4uVXXpon3?filename=Pug",
    uint256 private s_tokenCounter;

    event nftMinted(uint256 indexed tokenId);

    constructor() ERC721("Dogie", "DOG") {
        s_tokenCounter = 0;
    }

    function mintNft() public {
        _safeMint(msg.sender, s_tokenCounter);
        emit nftMinted(s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function tokenURI(uint256 /*tokenId*/) public view override returns (string memory) {
        return TOKEN_URI[0];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
