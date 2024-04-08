const fs = require('fs')


const writeContractAddress = async (chainId, addressData) => {
    const content = fs.readFileSync('./deployedAddress.json', 'utf8')
    if (content) {
        const data = JSON.parse(content)
        const index = data.findIndex(item => item.chainId === chainId)
        if (index === -1) {
            data.push({chainId, address : addressData})
        }
        else {
            console.log('hi', {...data[index].address, ...addressData})
            data[index].address = {...data[index].address, ...addressData}
        }

        fs.writeFileSync('./deployedAddress.json',JSON.stringify(data), { encoding: 'utf-8', flag: 'w+' })
        return
    } 

    fs.writeFileSync('./deployedAddress.json',JSON.stringify([{chainId, address : addressData}]), { encoding: 'utf-8', flag: 'w+' })
}

module.exports = writeContractAddress