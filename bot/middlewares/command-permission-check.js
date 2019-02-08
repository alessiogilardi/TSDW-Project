const bf = require('../bot-functions')
const utils = require('../../utils')

const middleware = () => async (ctx, next) => {
    if (ctx.updateType === 'message' && ctx.updateSubTypes.includes('text')) {
        const text = ctx.update.message.text.toLowerCase()
        if (text.startsWith('/')) {
            const commands = utils.arrayToLowerCase(ctx.session.userData.commands)
            if(commands.includes(text) || bf.genericCommands.includes(text)) {
                return next()
            }
            return ctx.reply('Non hai i diritti per eseguire questo comando!')
        }
    }
    return next()
}

module.exports = middleware