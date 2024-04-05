const hre = require('hardhat')
const { networkConfig, developmentChains } = require('../hardhat-network-config.js')
const { verify } = require('../utils/verify.js')

module.exports = async () => {
    const { deployments, getNamedAccounts } = hre
    const { log, deploy } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = hre.network.config.chainId
    const args = []

    const nftMarketplace = await deploy('NftMarketplace', {
        from: deployer,
        log: true,
        args,
        waitConfirmations: networkConfig?.[chainId]?.waitConfirmations || 1
    })

    if (!developmentChains.includes(hre.network.name) && process.env.ETHERSCAN_API_KEY) { await verify(nftMarketplace.address, args) }

    log('-----------------------------------------------------')
}

module.exports.tags = ['all', 'main']