const moment = require('moment')
const fs = require('fs')

const capitalizeFirstLetter = string => { return string.charAt(0).toUpperCase() + string.slice(1) }

exports.arrayContainsArray = (superset, subset) => {
    if (0 === subset.length || superset.length < subset.length) { return false }
    
    for (const s of subset) {
        if (!superset.includes(s)) { return false }
    }
    return true
  }

exports.Date = this.Date = {
    parse: aDate => {
        return moment(aDate, this.Date.validFormats).toDate()
    },
    isValid: aDate => {
        return moment(aDate, this.Date.validFormats).isValid() && 
               moment(aDate, this.Date.validFormats).isAfter(moment().startOf('day').subtract(1, 'ms'))
    },
    format: (aDate, aFormat) => {
        return moment(aDate).format(aFormat)
    },
    validFormats: ['YYYY-MM-DD', 'DD-MM-YYYY']
}

exports.Time = this.Time = {
    parse: aTime => {
        return moment(aTime, this.Time.validFormats).toDate()
    },
    isValid: aTime => {
        return moment(aTime, this.Time.validFormats).isValid()
    },
    validFormats: ['hh:mm']
}

exports.stringToUTM = utmString => {
    var tmp = utmString.split(' ')
    if (tmp.length !== 4) {
        //throw new Error('Not a valid UTM string!')
        return null
    }
    return {
        zoneNumber: tmp[0], 
        zoneLetter: tmp[1],
        easting:    tmp[2], 
        northing:   tmp[3]
    }
}

exports.loadRiskMatrix = filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.split('\n');
    for (let i = 0; i < content.length; i++) {
        content[i] = content[i].replace('\r','');
        content[i] = content[i].split(' ');
    }
    let contentJson = {};
    for (let scenario of content)
        contentJson[scenario[0]] = scenario.slice(1);
    delete contentJson['diff'];
    return contentJson;
}

exports.copyObject = copyObject = obj => {
    let ret = {}
    for (let i in obj) {
        ret[i] = obj[i]
    }
    return ret
}

/**
 * Funzione che converte le Stringhe in un array in LowerCase
 */
exports.stringArray2LC = stringArray2LC = aArray => {
    return aArray.map(str => str.toLowerCase())
    /*
    let ret = []
    for (const string of aArray) {
        ret.push(string.toLowerCase())
    }
    return ret*/
}

exports.getDistance = getDistance = (p1, p2) => {
    return Math.sqrt((p1.latitude - p2.latitude)^2 + (p1.longitude - p2.longitude)^2)
}

/**
 * Funzione che dato un array di array concatena ricorsivamente tutti gli elementi dei sotto Array
 * in un unico Array
 * @param {Array} arr 
 */
exports.flatten = flatten = (arr) => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

/**
 * Funzione che dato un Array conta per ogni valore le occorrenze di quel valore
 * @param {Array} array 
 */
exports.getOccurrences = (array) => {
    return array.reduce((accumulator, currentValue) => {
        !accumulator.hasOwnProperty(currentValue) ? (accumulator[currentValue] = 1) : (accumulator[currentValue]++)
        return accumulator
    }, {})
}
