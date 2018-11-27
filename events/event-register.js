const eventEmitters     = require('./event-emitters')
//const onCreateMission   = require('./db/on-create-mission')
const onRequestMission  = require('./bot/on-request-mission')
const onAcceptMission   = require('./bot/on-accept-mission')

const eventHandlers = {
    Db: {
        Mission: {
            //insert: () => eventEmitters.Db.Mission.on('insert', mission => onCreateMission(this.bot, mission))
            insert: () => eventEmitters.Db.Mission.on('insert', mission => {})
        }
    },
    Bot: {
        //requestMission: () => eventEmitters.Bot.on('requestMission', data => onRequestMission(this.bot, data)),
        requestMission: () => eventEmitters.Bot.on('requestMission', aMission => onRequestMission(this.bot, aMission)),
        acceptMission: () => eventEmitters.Bot.on('acceptMisson', (data, ctx) => onAcceptMission(data, ctx, this.bot))
    }
}



const register = bot => {
    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    this.bot = bot

    eventHandlers.Db.Mission.insert()
    eventHandlers.Bot.requestMission()
    eventHandlers.Bot.acceptMission()
}


module.exports = register
