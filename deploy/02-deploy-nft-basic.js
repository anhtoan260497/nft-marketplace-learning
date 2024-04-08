const hre = require('hardhat')
const { networkConfig, developmentChains } = require('../hardhat-network-config')
const fs = require('fs')
const writeContractAddress = require('../utils/writeContractAddress')


module.exports = async () => {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = hre.network.config.chainId

    const basicNft = await deploy('BasicNft', {
        from: deployer,
        log: true,
        waitConfirmations: networkConfig?.[hre.network.config.chainId]?.waitConfirmations || 1,
        args: []
    })
    writeContractAddress(chainId, { basicNft: basicNft.address })
    log('-----------------------------------------------------')

    if (!developmentChains.includes(hre.network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(basicNft.address, args = [])
    }
}


module.exports.tags = ['all', 'basic']