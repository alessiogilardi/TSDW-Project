/**
 * Modulo middleware del bot.
 * Il modulo si occupa di verificare se i dati dell'utente sono già stati caricati in memoria e 
 * nel caso negativo di eseguire una query al db per caricarli.
 */
const bf = require('../bot-functions')

const middleware = () => async (ctx, next) => {
    if (ctx.session.dataLoaded && ctx.session.isValid) {
        return next()
    }
    const telegramId = bf.getTelegramId(ctx)
    const data = await bf.loadData(telegramId)
    ctx.session.userData    = data
    ctx.session.dataLoaded  = true
    ctx.session.isValid     = true
    return next()
}

module.exports = middleware