const hre = require('hardhat')
const networkConfig = require('../hardhat-network-config.js')

module.exports = async () => {
    const {deployments, getNamedAccounts} = hre
    const {log, deploy} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = hre.network.config.chainId

    const nftMarketplace =  await deploy('NftMarketplace', {
        from : deployer,
        log : true,
        waitConfirmations : networkConfig?.[chainId]?.waitConfirmations || 1
    })   

    log('-----------------------------------------------------')
}