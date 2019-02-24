/**
 * Man mano che le persone accettano controllo quanti hanno
 * accettato finora e nel caso notifico il baseSup:
 * Se:
 * - La missione dura meno di 3h:
 *      1. Ci sono almeno 3 persone
 *      2. Almeno 2 possono fare i piloti
 *      3. Almeno 1 è crew
 *          --> Notifico il baseSup della missione per la scelta del Team
 * - La missione dura più di 3h
 *      1. Ci sono almeno 4 persone
 *      2. Almeno 2 possono fare i piloti
 *      3. Almeno 1 può fare il manutentore
 *      4. Almeno 1 è crew
 * 		    --> Notifico il baseSup della missione per la scelta del Team
 * 
 * NOTE: il baseSup sceglierà i ruoli che ognuno avrà nella
 * 		 missione a sua discrezione
 */

const { Personnel, Mission, EventLog } = require('../../db/queries')
const utils = require('../../utils')
const Telegraf = require('telegraf')
const { zip } = require('../../bot/bot-functions')

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
	for (const person of accepted) {
		const p = await Personnel.findById(person._id)
		tmp.push(`${p.name}\t${p.surname}\t->\t[[${person.roles.join(', ')}]]`)
	}
	return `C\'è un numero di persone sufficiente per formare un Team per la missione in data: ${utils.Date.format(missionDate, 'DD MMM YYYY kk:mm')}\n\n${tmp.join('\n')}`
}

/**
 * Funzione che restituisce il numero di occorrenze di ogni ruolo
 * per il personale che ha accettato la missione.
 * @param {*} acceptedArray 
 */
const getRolesOccurrences = (acceptedArray) => {
	let roles = acceptedArray.map(p => p.roles)
		roles = utils.flatten(roles)
		roles = utils.getOccurrences(roles)

	return roles
}

/**
 * Funzione che controlla se c'è un numero sufficiente di persone per compiere la Missione.
 * Se la missione dura meno di 3h controlla che ci siano alemeno 2 piloti e 1 crew,
 * altrimenti che ci siano almeno 2 pliloti, 1 crew e 1 manutentore.
 * @param {Mission} aMission 
 * @return {Boolean}
 */
const checkForTeam = (aMission) => {
	const accepted = aMission.personnel.accepted

	if (accepted.length < 3) { return false }

	const roles = getRolesOccurrences(accepted)
	
	// Se la missione dura meno di 3h
	if (aMission.description.duration.expected < 3) {
		// Ritorno true se ci sono almeno 2 piloti e almeno 1 crew
		return (roles['pilot'] >= 2 && roles['crew'] >= 1)
	}

	// Se la missione dura più di 3h
	if (accepted.length < 4) { return false }

	// Ritorno true se ci sono almeno 2 piloti, 1 crew e 1 manutentore
	return (roles['pilot'] >= 2 && roles['crew'] >= 1 && roles['maintainer'] >= 1)
}

/**
 * Ogniqualvolta una persona accetta una Missione controllo se è pronto un team e nel casonotifico il BS
 * ed inserisco l'evento missionAccepted nell'EventLogbook.
 * @param {*} bot 
 * @param {*} aMissionId 
 * @param {*} aPerson 
 */
const onMissionAccepted = async (bot, aMissionId, aPerson) => {
    if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')
    this.bot = bot

    const aMission 	= await Mission.findById(aMissionId, '')
    ;(async () => {
		if (checkForTeam(aMission)) {
			const message 		= await generateMessage(aMission.personnel.accepted, aMission.date)
			const supervisor 	= await Personnel.findById(aMission.supervisor)
			if (aMission.status.waitingForTeam.createTeamButton.messageId) {
				await deletePrevMessage(supervisor.telegramData.idTelegram, aMission.status.waitingForTeam.createTeamButton.messageId)
			}
			const { message_id } = await notify(supervisor.telegramData.idTelegram, message, aMission)
			await Mission.updateById(aMission._id, { $set: { 'status.waitingForTeam.createTeamButton.messageId': message_id }})
		}
	})()
    EventLog.insert({ type: 'missionAccepted', actor: aPerson._id, subject: {type: 'Mission', _id: aMission._id}, timestamp: new Date() })
}

module.exports = onMissionAccepted