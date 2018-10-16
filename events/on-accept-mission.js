const acceptMission = () => (data, ctx) => {
    ctx.editMessageReplyMarkup({})
    //ctx.answerCbQuery(cbQuery.cbMessage)
    ctx.answerCbQuery('Missione accettata')
    var missionId = data.mission._id

    // TODO: da gestire il fatto che prma che l'utente ne ccetti una potrebbero arrivargli più richieste
    // di più missioni

    // Aggiungo l'utente nella missione come accepted
    // recuperando il ruolo con data.role
    
    // Setto l'utente come non disponibile
}

module.exports = acceptMission