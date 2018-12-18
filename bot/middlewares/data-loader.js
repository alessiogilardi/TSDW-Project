/**
 * Modulo middleware del bot.
 * Il modulo si occupa di verificare se i dati dell'utente sono già stati caricati in memoria e 
 * nel caso esegue una query al db per caricarli.
 */
const bf = require('../bot-functions')

const middleware = () => async (ctx, next) => {
    if (ctx.message.chat === undefined) {
        return next()
    }
    if (ctx.session.dataLoaded && ctx.session.isValid) {
        return next()
    }
    const data = await bf.loadData(ctx.message.chat.id)
    ctx.session.userData    = data
    ctx.session.dataLoaded  = true
    ctx.session.isValid     = true
    return next()
}

module.exports = middleware