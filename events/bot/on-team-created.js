const { Personnel, EventLog } = require('../../db/queries')
const utils = require('../../utils')

/**
 *  Event handler che gestisce le operazioni successive alla creazione di un Team
 * 
 *  1. Notifico chi è stato aggiunto alla missione
 *  2. Aggiungo la missione alle suw waitingFor
 *  3. Avviso chi non è stato scelto
 *  4. Inserisco l'evento nell'Event Log
 */

const notify = (bot, idTelegram, message) => {
    bot.telegram
    .sendMessage(idTelegram, message)
}

const onTeamCreated = (bot, mission, team) => {
    if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')

    let toNotify = []
    toNotify.push(team.pilots.chief)
    toNotify.push(team.pilots.co)
    for (let p of team.crew) {
        toNotify.push(p)
    }
    for (let p of team.maintainers) {
        toNotify.push(p)
    }

    // TODO: specificare ruolo

    ;(async () => {
        for (let p of toNotify) {
            const person     = await Personnel.findById(p)
            const idTelegram = person.telegramData.idTelegram
            notify(bot, idTelegram, `Sei stato aggiunto alla missione del giorno ${utils.Date.format(mission.date, 'DD MMM YYYY')}`)
        }
    })()    

    // Cerco tra quelli che avevano accettato e che non sono stati inseriti nel team
    ;(async () => {
        for (let p of mission.personnel.accepted) {
            if (!toNotify.includes(p._id)) { 
                const person     = await Personnel.findById(p)
                const idTelegram = person.telegramData.idTelegram
                notify(bot, idTelegram, `__NON__ sei stato aggiunto alla missione del giorno ${utils.Date.format(mission.date, 'DD MMM YYYY')}`)
            }
        }
    })()

    EventLog.insert({ type: 'teamCreated', actor: mission.supervisor, subject: { type: 'Mission', _id: mission._id }, timestamp: new Date() })
}

module.exports = onTeamCreated