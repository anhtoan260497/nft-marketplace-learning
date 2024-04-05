const { parseEther } = require("ethers/lib/utils")
const { ethers } = require("hardhat")

const PRICE = parseEther('0.01')

const mintListAndBuy = async () => {
    const nftMarketplace = await ethers.getContractAt("NftMarketplace",'0x022D9Aa94E047E3D9b5F9e6813cA394ef01e5C99')
    const basicNft = await ethers.getContractAt('BasicNft','0xA016E19e63Bc24416350A33E7CD42EcbC0167229')

    console.log("Minting NFT...")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log("Approving NFT...")
    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approvalTx.wait(1)

    console.log("Listing NFT...")
    const listingTx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await listingTx.wait(1)
    console.log("NFT Listed!")

    console.log("Buying NFT...")
    const buyTx = await nftMarketplace.buyItem(basicNft.address, tokenId, { value: PRICE })
    await buyTx.wait(1)
    console.log("NFT bought!")
}


mintListAndBuy().then(() => process.exit(0)).catch(err => { console.log(err); process.exit(1) })

    