const hre = require('hardhat')
const { networkConfig, developmentChains } = require('../hardhat-network-config')


module.exports = async () => {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const basicNft = await deploy('BasicNft', {
        from: deployer,
        log: true,
        waitConfirmations: networkConfig?.[hre.network.config.chainId]?.waitConfirmations || 1,
        args: []
    })

    if (!developmentChains.includes(hre.network.name)) { 
        await verify(basicNft.address, args = []) 
    }
}


module.exports.tags = ['all', 'basic']