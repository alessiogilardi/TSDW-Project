const moment = require('moment')
const fs = require('fs')

/*
exports.arrayContainsArray = (superset, subset) => {
    if (0 === subset.length || superset.length < subset.length) return false
    subset.forEach(subVal => {
        console.log('Checking array contains array')
        if (!superset.includes(subVal)) return false
    })
    return true
}
*/

const capitalizeFirstLetter = string => { return string.charAt(0).toUpperCase() + string.slice(1) }

exports.arrayContainsArray = (superset, subset) => {
    if (0 === subset.length || superset.length < subset.length) { return false }
    
    for (let s of subset) {
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

exports.arrayToLowerCase = arrayToLowerCase = aArray => {
    let ret = []
    for (const string of aArray) {
        ret.push(string.toLowerCase())
    }
    return ret
}

/**
 * Converte un campo di un array di dizionari in array
 */
/*exports.arrayDictToArray = arrayDictToArray = (aArray, aField) => {
    let ret = []
    for (const elem of aArray) {
        ret.push(elem[aField])
    }
    return ret
}*/

/**
 * Converte un array di elementi in array di stringhe (converte ogni elementoin stringa)
 */
/*
exports.arrayToArrayOfStrings = arrayToArrayOfStrings = (aArray) => {
    let ret = []
    for (const elem of aArray) {
        ret.push(elem.toString())
    }

    return ret
}*/