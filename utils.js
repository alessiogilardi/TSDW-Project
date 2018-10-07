exports.arrayContainsArray = (superset, subset) => {
    if (0 === subset.length || superset.length < subset.length) return false
    subset.forEach(subVal => {
        if (!superset.includes(subVal)) return false
    })
    return true
}