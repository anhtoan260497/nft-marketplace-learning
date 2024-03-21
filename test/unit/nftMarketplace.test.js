const { expect, assert } = require("chai");
const { network, ethers, deployments, getNamedAccounts } = require("hardhat");
const { developmentChains } = require('../../hardhat-network-config');
const { parseEther, formatEther } = require("ethers/lib/utils");



if (!developmentChains.includes(network.name)) return

describe('NftMarketplace', () => {

    let nftMarketplace, basicNft, deployer, player;
    const PRICE = parseEther('0.01')
    const TOKEN_ID = 0

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        player = (await getNamedAccounts()).player
        await deployments.fixture(['all'])
        nftMarketplace = await ethers.getContract('NftMarketplace', deployer)
        basicNft = await ethers.getContract('BasicNft', deployer)
        await basicNft.mintNft()
        await basicNft.approve(nftMarketplace.address, TOKEN_ID)
    })


    describe('modifiers testing', () => {
        it('notListed modifiers: must reverted if NFT is listed', async () => {
            await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
            await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith(`NftMarketplace__AlreadyListed("${basicNft.address}", 0)`);
        })

        it('isOwner modifiers: must revert if NFT not owned by sender', async () => {
            const playerSigner = await ethers.getSigner(player)
            const playerConnectNftMarketplace = await nftMarketplace.connect(playerSigner)
            await expect(playerConnectNftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith(`NftMarketplace__NotNftOwnerForListing`)
        })
    })


    describe('function testing ', () => {
        describe('listItem', async () => {
            it('must reverted if price <= 0 ', async () => {
                await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)).to.be.revertedWith('NftMarketplace__InsufficentPrice')
            })

            it('emit an events after listing', async () => {
                expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit("ItemList")
            })
        })

        describe('buyItem', () => {
            let playerSigner, playerConnectNftMarketplace
            beforeEach(async () => {
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                playerSigner = await ethers.getSigner(player)
                playerConnectNftMarketplace = await nftMarketplace.connect(playerSigner)
            })

            it('add money to seller proceeds and nft must transfer to buyer', async () => {
                const oldSellerProceeds = await nftMarketplace.getProceeds(deployer)
                await playerConnectNftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                const newProceeds = await nftMarketplace.getProceeds(deployer)
                const newNftOwner = await basicNft.ownerOf(TOKEN_ID)
                assert.equal(formatEther(oldSellerProceeds + PRICE), formatEther(newProceeds))
                assert.equal(player, newNftOwner)
            })

            it('should emits an event after buy and trasfer items', async () => {
                expect(await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })).to.emit("Itembought")
            })
        })
    })

    describe('cancelItem', () => {
        it('delete an item after canceling', async () => {
            await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
            await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
            const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
            assert.equal(formatEther(listing.price), 0)
        })
    })

    describe('updateItem', () => {
        it('update price after run function ', async () => {
            await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
            await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, parseEther('0.02'))
            const newListing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
            assert.equal(formatEther(newListing.price), '0.02')
        })

        it('emit and event after updated', async () => {
            await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
            expect(await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, parseEther('0.02'))).to.emit('ItemUpdate')
            
        })
    })

    describe('widthdrawProcceeds', () => {
        beforeEach(async () => {
            await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
            playerSigner = await ethers.getSigner(player)
            playerConnectNftMarketplace = await nftMarketplace.connect(playerSigner)
        })

        it('reverted if dont have money to widthdraw', async () => {
            await expect(nftMarketplace.widthdrawProceeeds()).to.be.revertedWith('NftMarketplace__NotHasProceedToWidthdraw')
        })

        it('set seller balance to 0 after widthdraw', async () => {
            await playerConnectNftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
            await nftMarketplace.widthdrawProceeeds()
            const newBalance = await nftMarketplace.getProceeds(deployer)
            assert.equal(formatEther(newBalance), 0)
        })
    })

})