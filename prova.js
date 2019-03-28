
const flatten = arr => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

const getOccurrences = (array) => {
    return array.reduce((accumulator, currentValue) => {
        !accumulator.hasOwnProperty(currentValue) ? (accumulator[currentValue] = 1) : (accumulator[currentValue]++)
        return accumulator
    }, {})
}
const prova = () => {
    let accepted = [{id: 1, roles: [['p', 'd'], 'c', 'm']}, {id: 1, roles: ['p']}, {id: 1, roles: ['p', 'm']}, {id: 1, roles: ['c', 'm']}]

    let roles = flatten(accepted.map(p => p.roles))
    let count = getOccurrences(roles)
    //var merged = [].concat.apply([], roles);
    //console.log(merged)
    console.log('Roles:',roles)
    console.log('Occurrences:', count)
}

prova()