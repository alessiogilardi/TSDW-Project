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

const getPersonRoles = (aPerson, aMission) => {
    let roles = []
    let occupation = {
        pilot:      aPerson.roles.occupation.pilot,
        crew:       aPerson.roles.occupation.crew,
        maintainer: aPerson.roles.occupation.maintainer
    }


    // Se la persona è un pilota e non soddisfa i requisiti sul tipo di drone gli viene rimosso il ruolo di pilota per questa missione
    if (occupation.pilot
        && !aPerson.pilot.droneTypes.includes(aMission.droneType)) {
            occupation.pilot = false
    }
    // Se la persona è un manutentore ma la missione dura meno di 3h, gli viene rimosso il ruolo di manutentore
    if (occupation.maintainer
        && aMission.description.duration.expected < 3) {
            occupation.maintainer = false
    }
    for (const key in occupation) {
        if (occupation.hasOwnProperty(key)) {
            if (occupation[key]) { roles.push(key.toString()) }
        }
    }
    
    return roles
}

/**
 * Ritorna un array con i ruoli, ricopribili nella Mssione, di coloro che sono stati notificati.
 * @param {Array} notified 
 */
const getNotifiedRolesCount = async (aMission) => {
    const notified = aMission.personnel.notified
    let roles = []

    for (const p of notified) {
        const person = await Personnel.findById(p, '')
        roles.push(getPersonRoles(person, aMission))
    }
    roles = utils.flatten(roles)
    roles = utils.getOccurrences(roles)

    return roles
}

/**
 * Funzione che controlla se i ruoli dei notificati sono sufficienti per la Missione.
 * @param {Mission} aMission 
 */
const checkNotifiedRoles = async (aMission) => {
    const notified = aMission.personnel.notified
    const expected = aMission.description.duration.expected
    if (notified.length < 3) { return false }

    const roles = await getNotifiedRolesCount(aMission)

    // Se la missione dura meno di 3h
	if (expected < 3) {
		// Ritorno true se ci sono almeno 2 piloti e almeno 1 crew
		return (roles['pilot'] >= 2 && roles['crew'] >= 1)
    }
    
    // Se la missione dura più di 3h
	if (notified.length < 4) { return false }

	// Ritorno true se ci sono almeno 2 piloti, 1 crew e 1 manutentore
	return (roles['pilot'] >= 2 && roles['crew'] >= 1 && roles['maintainer'] >= 1)
}

/**
 * Funzione che cerca tra le Missioni e recupera quelle per cui la otifica ancora NON è stata estesa alle Basi
 * vicine.
 * Poi ritorna un Array di missioni per cui il timeout è stato superato.
 * @param {Object} extendTimeout
 * @returns {Array}
 */
const exceededTimeoutCheck = async (extendTimeout) => {
    const missions = await Mission.find({ 'notified.extend': false, 'notifiedBases': { $exists: true, $size: 0 }, 'status.waitingForTeam.value': true, 'status.teamCreated.value': false, 'status.aborted.value': false }, '')
    let ret = []
    let timeout = 0
    const now = new Date().getTime()
    for (const mission of missions) {
        // Setto il timeout da usare
        if (!(await checkNotifiedRoles(mission))) {
            timeout = 0
        } else if (mission.date.getTime() - mission.status.requested.timestamp.getTime() < 12*60*60*1000) {
            // Se la missione ha data di inizio entro 12h uso il timeout breve
            timeout = extendTimeout.short
        } else {
            timeout = extendTimeout.long
        }
        // Se ho sforato il timeout aggiungo la Missione a quelle da notificare
        if (now - mission.status.waitingForTeam.timestamp >= timeout*60000) {
            ret.push(mission)
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
    let message = `TIMEOUT LOCALE\n` +
    `Non riesco a trovare abbastanza personale per la missione del ${utils.Date.format(mission.date, 'DD MMM YYYY hh:mm')}, oppure non hai ancora creato un team.\n`
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

        const accepted  = mission.personnel.accepted.map(p => p._id.toString())
        const declined  = mission.personnel.declined.map(p => p._id.toString())
        const notified  = mission.personnel.notified.map(p => p._id.toString())
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