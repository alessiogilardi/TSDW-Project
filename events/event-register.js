/**
 * Modulo che assegna ad ogni evento il modulo che lo gestisce
 */

const ee                 = require('./event-emitters')
const onRequestMission   = require('./bot/on-mission-requested')
const onMissionOrganized = require('./bot/on-mission-organized')
const onTeamCreated      = require('./bot/on-team-created')

const register = bot => {
    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')

    ee.bot.on('missionRequested',   missions =>         onRequestMission(bot, missions))
    ee.bot.on('missionOrganized',   mission  =>         onMissionOrganized(bot, mission))
    ee.bot.on('teamCreated',        (mission, team) =>  onTeamCreated(bot, mission, team))
}

module.exports = register