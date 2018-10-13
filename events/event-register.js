const eventEmitters = require('./event-emitters')
const onCreateMission = require('./on-create-mission')
const onRequestMission = require('./on-request-mission')

const eventHandlers = {
    Db: {
        Mission: {
            insert: () => eventEmitters.Db.Mission.on('insert', mission => onCreateMission(this.bot, mission))
        }
    },
    Bot: {
        requestMission: () => eventEmitters.Bot.on('requestMission', data => onRequestMission(this.bot, data))
    }
}



const register = bot => {
    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    this.bot = bot

    eventHandlers.Db.Mission.insert()
    eventHandlers.Bot.requestMission()
}


module.exports = register