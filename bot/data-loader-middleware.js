/**
 * Modulo middleware del bot.
 * Il modulo si occupa di verificare se i dati dell'utente sono già stati caricati in memoria e 
 * nel caso esegue una query al db per caricarli.
 */
const bf = require('./bot-functions.js');

const middleware = () => (ctx, next) => {
    if (ctx.session.dataLoaded && ctx.session.isValid)
        return next()
    bf.loadData(ctx.message.chat.id, data => {
        ctx.session.userData    = data;
        ctx.session.dataLoaded  = true;
        ctx.session.isValid     = true;
        return next();
    });
}

module.exports = middleware;