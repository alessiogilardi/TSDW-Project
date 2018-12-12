

const queries   = require('./db/queries')
const Personnel = queries.Personnel
const Mission   = queries.Mission

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

 /**
  * CONSIDERAZIONE:
  * Se ogni volta che ho un team pronto notifico il BaseSup con tutti quelli che hanno accettato
  * invio un sacco di messaggi e richio anche di reinviare messaggi già mandati.
  * 
  * Sarebbe meglio dire al BaseSup che è pronto un team con tot membri e loro dati,
  * e dargli la possibilità di premere un bottone per vedere chi sono e eventulmente formare un team con quelli che hanno accettato.
  * 	--> IMPORTANTE: gestire questa cosa con una Scene e cancellare i messaggi mandati in questa Scene quando si esce
  */

 const notify = (telegramId, message) => {

 }

const acceptMission = async (bot, ctx) => {
    const missionId = ctx.state.data[0]
	const roles 	= ctx.state.data[1].split(',') // Ruoli che può ricoprire nella missione
	const person 	= ctx.session.userData
	
	const aMission 	= await Mission.findById(missionId, '')

	await Personnel.updateById(person._id, { $push: { 'accepted.idMission': aMission._id, date: aMission.date, roles: roles } })
	await Mission.updateById(aMission._id, { $pull: { 'personnel.notified': person._id } })
	await Mission.updateById(aMission._id, { $push: { 'personnel.accepted': person._id } })

	// Cerco le persone che hanno accettato
	const aMission = await Mission.findById(missionId, '')
	const accepted = aMission.personnel.accepted
	if (accepted.length < 3) {
		return
	}
	// Se la missione dura meno di 3h
	if (aMission.description.duration.expected < 3) {
		let pilotCount = 0
		for (let person of accepted) {
			if (person.roles.includes('pilot')) 
				pilotCount++
		}
		if (pilotCount >= 2) {
			// TODO: Notifico il BaseSup
		}
		return
	}

	// Se la missione dura più di 3h
	if (accepted.length < 4) {
		return
	}
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
		// TODO: Notifico il baseSup
	}



}

module.exports = acceptMission