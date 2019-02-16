/**
 * Modulo che controlla il Timeout Extend e se è stato superato notifica il BS chiedendogli se vuole
 * inviare la richiesta alle Basi vicine.
 * Se supero il Timeout:
 *  1. Il BS riceve un messaggio con l'elenco delle Basi, ad ogni Base è assegnato un Button
 *  2. Premendo il Button vengono notificati:
 *      - Il BS della base relativa
 *      - Il personale di quella Base
 *  3. Aggiungo la Base all'elenco delle Basi notificate in Mission.notifiedBases
 */

const { Mission, Base, Personnel } = require('../../db/queries')
const Telegraf 		 	= require('telegraf')
const timers            = require('timers')
const utils             = require('../../utils')
const fs                = require('fs')

/**
 * Funzione che cerca tra le Missioni e recupera quelle per cui la otifica ancora NON è stata estesa alle Basi
 * vicine.
 * Poi ritorna un Array di missioni per cui il timeout è stato superato.
 * @param {Object} timeout
 * @returns {Array}
 */
const exceededTimeoutCheck = async (timeout) => {
    const missions = await Mission.find({ 'notified.extend': false, 'notifiedBases': { $exists: true, $size: 0 }, 'status.waitingForTeam.value': true, 'status.teamCreated.value': false, 'status.aborted.value': false }, '')
    let ret = []
    const now = new Date().getTime()
    for (const mission of missions) {
        // Se la missione ha data di inizio entro 12h uso il timeout breve
        if (mission.date.getTime() - mission.status.requested.timestamp.getTime() < 12*60*60*1000) {
            if (now - mission.status.waitingForTeam.timestamp >= timeout.short*60000) {
                ret.push(mission)
            } 
        } else {
            if (now - mission.status.waitingForTeam.timestamp >= timeout.long*60000) {
                ret.push(mission)
            }
        }
    }
    return ret
}

/**
 * Funzione che permette al BS di contattare le altre basi oppure di abortire la missione
 * @param {String}   idTelegram
 * @param {Mission}  mission
 * @param {Array}    bases
 */
const sendChoose = async (idTelegram, mission, bases) => {
    const message =/* `Non riesco a trovare abbastanza personale per la missione del ${utils.Date.format(mission.date, 'DD MMM YYYY hh:mm')}.\n` + */
    `Vuoi contattare altre Basi o Abortire la missione?\n` +
    `Premi sulle basi che vuoi contattare.`

    let buttons = []
    for (const base of bases) {
        const buttonText = base.name
        const buttonData = `${zip['extendToBase']}:${base._id}:${mission._id}`
        buttons.push(Telegraf.Markup.callbackButton(buttonText, buttonData))
    }
    
    await this.bot.telegram.sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup(m => m.inlineKeyboard(buttons)                
    ))
    await this.bot.telegram.sendMessage(idTelegram, 'Vuoi abortire la missione?', Telegraf.Extra
        .markdown()
        .markup(m => m.inlineKeyboard([
            m.callbackButton('Abort', `${zip['abortMission']}:${mission._id}`)
    ])))
    
}

/**
 * Invia un report al BS con chi ha accettato, chi ha rifiutato e chi non ha risposto.
 * @param {*} notified 
 * @param {*} accepted 
 * @param {*} declined 
 */
const sendReport = async (idTelegram, mission, notified, accepted, declined) => {
    let message = `Non riesco a trovare abbastanza personale per la missione del ${utils.Date.format(mission.date, 'DD MMM YYYY hh:mm')}.\n`
    let acceptedMessage = `Hanno accettato:\n`
    let declinedMessage  = `Hanno rifiutato:\n`
    let othersMessage   = `Non hanno risposto:\n`
    for (const p of notified) {
        const person = await Personnel.findById(p, '')
        if (accepted.includes(p)) {
            acceptedMessage += `${person.name} ${person.surname}\n` 
        } else if (declined.includes(p)) {
            declinedMessage += `${person.name} ${person.surname}\n` 
        } else {
            othersMessage += `${person.name} ${person.surname}\n` 
        }
    }

    await this.bot.telegram
    .sendMessage(idTelegram, `${message}\n${acceptedMessage}\n${declinedMessage}\n${othersMessage}`)
}
/**
 * Funzione che notifica i BS su quali missioni hanno sforato il timeout "locale".
 *  1. Viene mandato un report della situazione attuale su chi ha accettato, rifiutato o non ha risposto.
 *  2. Vengono mandati ai BS i Buttons per poter aggiungere le Basi oppure abortire la Missione.
 * @param {Array} missions 
 */
const notifyBaseSupervisors = async (missions) => {
    if (missions.length === 0) { return }

    for (const mission of missions) {
        const supervisor    = await Personnel.findById(mission.supervisor, '')
        const bases         = await Base.find({ _id: { $ne: mission.base } }, '')

        const accepted  = mission.personnel.accepted.map(p => p._id)
        const declined  = mission.personnel.declined.map(p => p._id)
        const notified  = mission.personnel.notified.map(p => p._id)
        await sendReport(supervisor.telegramData.idTelegram, mission, notified, accepted, declined)
        await sendChoose(supervisor.telegramData.idTelegram, mission, bases)

        Mission.updateById(mission._id, { $set: { 'notified.extend': true } })
    }

}

const periodicTask = async (bot) => {
    this.bot = bot
    const period = 60000 // 60000ms -> 1min
    timers.setInterval(async () => {
        const { extend }    = JSON.parse(fs.readFileSync('timeouts.json', 'utf8'))
        const missions      = await exceededTimeoutCheck(extend)

        notifyBaseSupervisors(missions)
    }, period)
}

module.exports = periodicTask