const moment = require('moment')

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

exports.arrayContainsArray = (superset, subset) => {
    if (0 === subset.length || superset.length < subset.length) {
      return false;
    }
    for(var i = 0; i < subset.length; i++) {
      if(superset.indexOf(subset[i]) === -1) return false;
    }
    return true;
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