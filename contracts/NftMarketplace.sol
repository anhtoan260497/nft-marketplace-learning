// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error NftMarketplace__InsufficentPrice();
error NftMarketplace__NotApproved();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotNftOwnerForListing();
error NftMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotEnoughBalanceToBuy(address nftAddress, uint256 tokenId, uint256 price);
error NftMarketplace__NotHasProceedToWidthdraw();
error NftMarketplace__SellerNotHoldingNft();
error NftMarketplace__TransferFailed();

contract NftMarketplace is ReentrancyGuard {
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

    event ItemBought(
        address indexed buyer,
        address indexed NftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemUpdate (
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 newPrice
    );

    event ItemCancel(address indexed nftAddress, uint256 indexed tokenId, address indexed seller);

    mapping(address => mapping(uint256 => Listing)) private s_listing; // s_listing : {address : { tokenid : { price, seller }}}
    mapping(address => uint256) private s_proceeds;

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
        if (owner != spender) revert NftMarketplace__NotNftOwnerForListing();
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listing[nftAddress][tokenId];
        if (listing.price <= 0) revert NftMarketplace__NotListed(nftAddress, tokenId);
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

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable isListed(nftAddress, tokenId) nonReentrant {
        Listing memory listedItem = s_listing[nftAddress][tokenId];
        if (msg.value < listedItem.price)
            revert NftMarketplace__NotEnoughBalanceToBuy(nftAddress, tokenId, msg.value);

        s_proceeds[listedItem.seller]  += msg.value;
        delete (s_listing[nftAddress][tokenId]);
        IERC721 nft = IERC721(nftAddress);
        if(nft.ownerOf(tokenId) != listedItem.seller) revert NftMarketplace__SellerNotHoldingNft();
        nft.safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    ) external isListed(nftAddress, tokenId) isNftOwner(nftAddress, tokenId, msg.sender) {
        delete s_listing[nftAddress][tokenId];
        emit ItemCancel(nftAddress, tokenId, msg.sender);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isListed(nftAddress, tokenId) isNftOwner(nftAddress, tokenId, msg.sender) {
        s_listing[nftAddress][tokenId].price = newPrice;
        emit ItemUpdate(nftAddress, tokenId, msg.sender, newPrice) ;
    }

    function widthdrawProceeeds () external nonReentrant{
        uint256 proceeds = s_proceeds[msg.sender];
        if(proceeds <= 0 ) revert NftMarketplace__NotHasProceedToWidthdraw();
        s_proceeds[msg.sender] = 0;
        (bool success,) = payable(msg.sender).call{value : proceeds}("");
        if(!success) revert NftMarketplace__TransferFailed();
    }

    // Getter Functions

    function getListing(address nftAddress, uint256 tokenId) external view returns(Listing memory) {
        return s_listing[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns(uint256){
        return s_proceeds[seller];
    }
}
