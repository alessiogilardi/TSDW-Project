/**
 * Modulo che assegna ad ogni evento il modulo che lo gestisce
 */

const ee = require('./event-emitters')
//const onCreateMission   = require('./db/on-create-mission')
const onRequestMission   = require('./bot/on-mission-requested')
const onAcceptMission    = require('./bot/on-accept-mission')
const onOrganizedMission = require('./bot/on-organized-mission')

/*
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
*/


const register = bot => {
    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    //this.bot = bot

    ee.bot.on('missionRequested', missions => onRequestMission(bot, missions))
    ee.bot.on('missionOrganized', mission  => onOrganizedMission(bot, mission))


    /*
    eventHandlers.Db.Mission.insert()
    eventHandlers.Bot.requestMission()
    eventHandlers.Bot.acceptMission()
    */
}


module.exports = register
