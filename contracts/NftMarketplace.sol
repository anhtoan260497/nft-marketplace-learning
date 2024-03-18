// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/interfaces/IERC721.sol";

error NftMarketplace__InsufficentPrice();
error NftMarketplace__NotApproved();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotNftOwnerForListing(address nftAddress, uint256 tokenId);

contract NftMarketplace {
    struct Listing {
        uint256 price;
        address seller;
    }

    event ItemList(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    mapping(address => mapping(uint256 => Listing)) private s_listing; // s_listing : {address : { tokenid : { price, seller }}}

    modifier NotListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listing[nftAddress][tokenId];
        if (listing.price != 0) revert NftMarketplace__AlreadyListed(nftAddress, tokenId);
        _;
    }

    modifier isNftOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (owner != spender) revert NftMarketplace__NotNftOwnerForListing(nftAddress, tokenId);
        _;
    }

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        NotListed(nftAddress, tokenId, msg.sender)
        isNftOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) revert NftMarketplace__InsufficentPrice();
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) revert NftMarketplace__NotApproved();
        s_listing[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemList(msg.sender, nftAddress, tokenId, price);
    }
}
