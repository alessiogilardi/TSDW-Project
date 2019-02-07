const utils = require('../../utils')
const Telegraf = require('telegraf')
const { zip, unZip } = require('../bot-functions')
const { Personnel, Mission } = require('../../db/queries')


/**
 * 1. Ricevo _id della missione accetttata tramite callbackButton
 * 2. Aggiungo la missione a quelle accettate in
 *  	--> missions.accepted
 * 3. Aggiungo il Personale che ha accettato alla missione
 * 		--> rimuovo da personnel.notified
 * 		--> aggiungo in personnel.accepted
 * 4. Man mano che le persone accettano controllo quanti hanno
 * 	  accettato finora e nel caso notifico il baseSup:
 * 		Se:
 * 			- La missione dura meno di 3h:
 * 				1. Ci sono almeno 3 persone
 * 				2. Almeno 2 possono fare i piloti
 * 					--> Notifico il baseSup della missione per la scelta del Team
 * 			- La missione dura più di 3h
 * 				1. Ci sono almeno 4 persone
 * 				2. Almeno 2 possono fare i piloti
 * 				3. Almeno 1 può fare il manutentore
 * 					--> Notifico il baseSup della missione per la scelta del Team
 * 
 * NOTA: il baseSup sceglierà i ruoli che ognuno avrà nella
 * 		 missione a sua discrezione
 */

const notify = async (idTelegram, message, mission) => {
	this.bot.telegram
		.sendMessage(idTelegram, message, Telegraf.Extra
			.markdown()
			.markup(m => m.inlineKeyboard([
				m.callbackButton('Accetta', `${zip['createTeam']}:${mission._id}`)
			])))
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
		tmp.push(`${p.name}\t${p.surname}\t->\t[${person.roles.join(', ')}]`)
	}
	return `C\'è un numero di persone sufficiente per formare un Team per la missione in data: ${utils.Date.format(missionDate, 'DD MMM YYYY')}\n\n${tmp.join('\n')}`
}

/**
 * Funziona che controlla se c'è un numero sufficiente di persone per formare un team.
 * @param {ObjectId} missionId 
 */
const checkForTeam = async missionId => {
	const aMission = await Mission.findById(missionId, '')
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
			notify(supervisor.telegramData.idTelegram, message, aMission)
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
		notify(supervisor.telegramData.idTelegram, message, aMission)
	}
}

const acceptMission = async (bot, ctx) => {
	if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')
	this.bot = bot

	const missionId = ctx.state.data[0]
	let roles = ctx.state.data[1].split(',') // Ruoli che può ricoprire nella missione
	for (let i in roles) {
		roles[i] = unZip[roles[i]]
	}
	const person = ctx.session.userData.person
	const aMission = await Mission.findById(missionId, '')

	Personnel.updateById(person._id, { $push: { 'missions.accepted': { idMission: aMission._id, date: aMission.date, roles: roles } } })
	// forse non serve rimuovere il personale dai notificati -> await Mission.updateById(aMission._id, { $pull: { 'personnel.notified': person._id } })
	await Mission.updateById(aMission._id, { $push: { 'personnel.accepted': { _id: person._id, roles: roles } } })

	checkForTeam(aMission._id)
}

module.exports = acceptMission