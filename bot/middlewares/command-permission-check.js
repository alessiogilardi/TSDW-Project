const bf = require('../bot-functions')
const utils = require('../../utils')

/**
 * Funzione che controlla se il messaggio ricevuto è un messaggio di testo.
 * @param {Context} ctx
 * @returns {Boolean}
 */
const isText = (ctx) => {
    return (ctx.updateType === 'message' && ctx.updateSubTypes.includes('text'))
}

/**
 * Funzione che controlla se il messaggio ricevuto è un comando.
 * @param {Context} ctx
 * @returns {Boolean}
 */
const isCommand = (ctx) => {
    return (isText(ctx) && ctx.update.message.text.startsWith('/'))
}

/**
 * Funzione che restituisce i comandi disponibili all'utente.
 * Comandi specifici del ruolo e comandi generici
 * @param {Context} ctx 
 * @returns {Array}
 */
const getCommands = (ctx) => {
    const commands  = utils.stringArray2LC(ctx.session.userData.commands)    
    const generic   = bf.genericCommands
    return commands.concat(generic)
}

/**
 * Funzione che verifica che l'utente abbia i diritti per eseguire il comando.
 * @param {Context} ctx
 * @returns {Boolean}
 */
const hasRight = (ctx) => {
    const text = ctx.update.message.text.toLowerCase()
    return getCommands(ctx).includes(text)
}

const middleware = () => async (ctx, next) => {
    if (!isCommand(ctx) || hasRight(ctx)) {
        return next()
    }

    /*
    if (!isCommand(ctx)) {
        return next()
    }
    if (isCommand(ctx) && hasRight(ctx)) {
        return next() 
    }*/
    return await ctx.reply('Non hai i diritti per eseguire questo comando!')
}

module.exports = middleware