const bf = require('../bot-functions')
const utils = require('../../utils')

const isText = (ctx) => {
    return (ctx.updateType === 'message' && ctx.updateSubTypes.includes('text'))
}

const isCommand = (ctx) => {
    return (isText(ctx) && ctx.update.message.text.startsWith('/'))
}

/**
 * Funzione che restituisce i comandi disponibili all'utente.
 * Comandi specifici del ruolo e comandi generici
 * @param {Context} ctx 
 */
const getCommands = (ctx) => {
    const commands  = utils.stringArray2LC(ctx.session.userData.commands)
    const generic   = bf.genericCommands
    return commands.concat(generic)
}

const hasRight = (ctx) => {
    const text = ctx.update.message.text.toLowerCase()
    return getCommands(ctx).includes(text)
}

const middleware = () => async (ctx, next) => {
    if (!isCommand(ctx) || hasRight(ctx)) {
        return next() 
    }
    //if (!hasRight(ctx)) { return next() }
    return ctx.reply('Non hai i diritti per eseguire questo comando!')

    /*if (ctx.updateType === 'message' && ctx.updateSubTypes.includes('text')) {
        const text = ctx.update.message.text.toLowerCase()
        if (text.startsWith('/')) {
        if (isCommand(ctx)) {
            const text = ctx.update.message.text.toLowerCase()
            const commands = utils.arrayToLowerCase(ctx.session.userData.commands)
            if(commands.includes(text) || bf.genericCommands.includes(text)) {
                return next()
            }
            return ctx.reply('Non hai i diritti per eseguire questo comando!')
        }
    //}
    return next()*/
}

module.exports = middleware