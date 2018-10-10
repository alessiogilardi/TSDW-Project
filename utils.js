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

exports.date = {
    isValid: aDate => {
        return (moment(aDate, 'YYYY-MM-DD').isValid() || moment(aDate, 'DD-MM-YYYY').isValid()) && 
        (moment(aDate, 'YYYY-MM-DD').isAfter(moment().startOf('day')) || moment(aDate, 'DD-MM-YYYY').isAfter(moment().startOf('day')))
    }
}