const Telegraf  = require('telegraf')
const { Personnel, EventLog } = require('../../db/queries')
const utils = require('../../utils')

/**
 *  Event handler che gestisce le operazioni successive alla creazione di un Team
 * 
 *  1. Notifico chi è stato aggiunto alla missione
 *  2. Aggiungo la missione alle waitingForLogbook -> Implementato in funzione periodica: checkTodayMissions
 *  3. Avviso chi non è stato scelto
 *  4. Rimuovo la missione dalle Accettate da chi non è stato scelto, in modo da
 *      renderlo nuovamente disponibile 
 *  5. Inserisco l'evento nell'Event Log
 */

const onTeamCreated = async (bot, mission, team) => {
    if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')

    const chiefPilotId = team.pilots.chief
    const coPilotId    = team.pilots.co
    const crew         = team.crew
    const maintainers  = team.maintainers
    const notified     = [chiefPilotId, coPilotId]

    for (const p of crew) { notified.push(p) }
    for (const p of maintainers) { notified.push(p) }
    
    // Notifico i piloti
    ;(async () => {
        const chiefPilot  = await Personnel.findById(chiefPilotId)
        const coPilot     = await Personnel.findById(coPilotId)
        bot.telegram.sendMessage(chiefPilot.telegramData.idTelegram, 
            `Sei stato aggiunto alla missione del giorno **${utils.Date.format(mission.date, 'DD MMM YYYY')}** come **Chief Pilot**`,
            Telegraf.Extra.markdown())
            .catch(err => {})
        bot.telegram.sendMessage(coPilot.telegramData.idTelegram, 
            `Sei stato aggiunto alla missione del giorno **${utils.Date.format(mission.date, 'DD MMM YYYY')}** come **Co Pilot**`,
            Telegraf.Extra.markdown())
            .catch(err => {})
    })()

    // Notifico la crew
    ;(async () => {
        for (const p of crew) {
            const person     = await Personnel.findById(p)
            const idTelegram = person.telegramData.idTelegram
            bot.telegram.sendMessage(idTelegram, 
                `Sei stato aggiunto alla missione del giorno **${utils.Date.format(mission.date, 'DD MMM YYYY')}** come **Crew**`,
                Telegraf.Extra.markdown())
                .catch(err => {})
        }
    })()

    // Notifico i maintainers
    ;(async () => {
        for (const p of maintainers) {
            const person     = await Personnel.findById(p)
            const idTelegram = person.telegramData.idTelegram
            bot.telegram.sendMessage(idTelegram, 
                `Sei stato aggiunto alla missione del giorno **${utils.Date.format(mission.date, 'DD MMM YYYY')}** come **Maintainer**`,
                Telegraf.Extra.markdown())
                .catch(err => {})
        }
    })()

    // Cerco tra quelli che avevano accettato e che non sono stati inseriti nel team
    ;(async () => {
        const accepted  = mission.personnel.accepted
        const notif     = utils.arrayToArrayOfStrings(notified)
        for (const p of accepted) {
            if (!notif.includes(p._id.toString())) {
                const person     = await Personnel.findById(p._id)
                const idTelegram = person.telegramData.idTelegram
                bot.telegram.sendMessage(idTelegram,
                    `**NON** sei stato aggiunto alla missione del giorno **${utils.Date.format(mission.date, 'DD MMM YYYY')}**`,
                    Telegraf.Extra.markdown())
                    .catch(err => {})
                // Rimuovo la missione da quelle Accettate in modo che la persona sia di nuovo disponibile
                Personnel.updateById(p, { $pull: { 'missions.accepted': { idMission: mission._id }}})
            }
        }
    })()

    EventLog.insert({ type: 'teamCreated', actor: mission.supervisor, subject: { type: 'Mission', _id: mission._id }, timestamp: new Date() })
}

module.exports = onTeamCreated