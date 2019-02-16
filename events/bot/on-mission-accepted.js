const { Personnel, Mission, EventLog } = require('../../db/queries')
const utils = require('../../utils')
const Telegraf = require('telegraf')
const { zip } = require('../../bot/bot-functions')

/**
 * Man mano che le persone accettano controllo quanti hanno
 * accettato finora e nel caso notifico il baseSup:
 * Se:
 * - La missione dura meno di 3h:
 *      1. Ci sono almeno 3 persone
 *      2. Almeno 2 possono fare i piloti
 *          --> Notifico il baseSup della missione per la scelta del Team
 * - La missione dura più di 3h
 *      1. Ci sono almeno 4 persone
 *      2. Almeno 2 possono fare i piloti
 *      3. Almeno 1 può fare il manutentore
 * 		    --> Notifico il baseSup della missione per la scelta del Team
 * 
 * NOTE: il baseSup sceglierà i ruoli che ognuno avrà nella
 * 		 missione a sua discrezione
 */

/**
 * Funzione che invia un Bottone al baseSupervisor per creare il Team
 * @param {Numer}   idTelegram  idTelegram del baseSupervisor
 * @param {String}  message     Messaggio per il baseSupervisor contenente il personale che ha accettato per ora
 * @param {Mission} mission     La missione appena accettata
 * @returns {Object}    Ritorna il messaggio appena mandato
 */
const notify = async (idTelegram, message, mission) => {
	return this.bot.telegram
		.sendMessage(idTelegram, message, Telegraf.Extra
			.markdown()
			.markup(m => m.inlineKeyboard([
				m.callbackButton('Crea Team', `${zip['createTeam']}:${mission._id}`)
			])))
}

/**
 * Cancella il messaggio mandato in precedenza
 * @param {Number} chatId 
 * @param {Number} messageId 
 */
const deletePrevMessage = async (chatId, messageId) => {
    await this.bot.telegram.deleteMessage(chatId, messageId)
}

/**
 * Genera il messaggio da inviare al baseSupervisor con il Personale che ha accettato la Missione
 * e i rispettivi ruoli possibili.
 * @param {Array}	accepted
 * @param {Date}	missionDate
 */
const generateMessage = async (accepted, missionDate) => {
	let tmp = []
	for (let person of accepted) {
		let p = await Personnel.findById(person._id)
		tmp.push(`${p.name}\t${p.surname}\t->\t\[${person.roles.join(', ')}\]`)
	}
	return `C\'è un numero di persone sufficiente per formare un Team per la missione in data: ${utils.Date.format(missionDate, 'DD MMM YYYY')}\n\n${tmp.join('\n')}`
}

/**
 * Funziona che controlla se c'è un numero sufficiente di persone per formare un team.
 * @param {ObjectId} missionId 
 */
const checkForTeam = async aMission => {
    const accepted = aMission.personnel.accepted
    
	if (accepted.length < 3) { return }

	// Se la missione dura meno di 3h
	if (aMission.description.duration.expected < 3) {
		let pilotCount = 0
		for (let person of accepted) {
			if (person.roles.includes('pilot'))
				pilotCount++
		}

		
		if (pilotCount >= 2) {
			const message = await generateMessage(accepted, aMission.date)
            const supervisor = await Personnel.findById(aMission.supervisor)
            if (aMission.status.waitingForTeam.createTeamButton.messageId) {
                await deletePrevMessage(supervisor.telegramData.idTelegram, aMission.status.waitingForTeam.createTeamButton.messageId)
            }
            const { message_id } = await notify(supervisor.telegramData.idTelegram, message, aMission)
            Mission.updateById(aMission._id, { $set: { 'status.waitingForTeam.createTeamButton.messageId': message_id }})
		}
		return
	}

	// Se la missione dura più di 3h
	if (accepted.length < 4) { return }

	let pilotCount = 0
	let maintCount = 0
	let pilotAndMaintCount = 0
	for (let person of accepted) {
		if (person.roles.includes('pilot') &&
			!person.roles.includes('maintainer')) {
			pilotCount++
		}
		if (person.roles.includes('maintainer') &&
			!person.roles.includes('pilot')) {
			maintCount++
		}
		if (person.roles.includes('pilot') &&
			person.roles.includes('maintainer')) {
			pilotAndMaintCount++
		}
	}

	if (pilotCount >= 2 &&
		maintCount >= 1 &&
		pilotCount + maintCount + pilotAndMaintCount >= 3) {
		const message = await generateMessage(accepted)
		const supervisor = await Personnel.findById(aMission.supervisor)
		const { message_id } = await notify(supervisor.telegramData.idTelegram, message, aMission)
        Mission.updateById(aMission._id, { $set: { 'status.waitingForTeam.createTeamButton.messageId': message_id }})
    }
    
}

const onMissionAccepted = async (bot, aMissionId, aPerson) => {
    if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')
    this.bot = bot

    const aMission 	= await Mission.findById(aMissionId, '')
    
    checkForTeam(aMission)
    EventLog.insert({ type: 'missionAccepted', actor: aPerson._id, subject: {type: 'Mission', _id: aMission._id}, timestamp: new Date() })
}

module.exports = onMissionAccepted