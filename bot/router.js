const Router = require('telegraf/router')
const bf     = require('./bot-functions')
const unZip  = bf.unZip

const mRouter = new Router(({ callbackQuery }) => {
    if (!callbackQuery.data) return
    const parts = callbackQuery.data.split(':')
    return {
        route: unZip[parts[0]],
        state: { data: parts.slice(1,parts.length) }
    }
})

module.exports = mRouter