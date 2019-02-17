const { Mission, Personnel, Drone } = require('../db/queries.js')
const timers    = require('timers')
//const utils     = require('../utils.js')

/**
 * Dizionario usato per de-comprimere i nomi delle actions per evitare il limite di 64 byte
 * Nel caso si può aumentare la compressione dei nomi delle action
 */
exports.unZip = unZip = {
    '1': 'organizeMission',
    '2': 'acceptMission',
    '3': 'declineMission',
    '4': 'addDroneToMission',
    '5': 'createTeam',
    '6': 'pilot',
    '7': 'crew',
    '8': 'maintainer',
    '9': 'addToTeam',
    '10': 'extendToBase',
    '11': 'abortMission'
}
/**
 * Dizionario usato per comprimenre i nomi delle actions per evitare il limite di 64 byte
 * Nel caso si può aumentare la compressione dei nomi delle action
 */
exports.zip = zip = {
    organizeMission:    '1',
    acceptMission:      '2',
    declineMission:     '3',
    addDroneToMission:  '4',
    createTeam:         '5',
    pilot:              '6',
    crew:               '7',
    maintainer:         '8',
    addToTeam:          '9',
    extendToBase:       '10',
    abortMission:       '11'
}

/**
 * Comandi consentiti ad un certo ruolo
 */
const roleToOperation = {
	AM:         ['/requestMission'],
	BS:         ['/addQtb'],
	pilot:      ['/addLogbook'],
    crew:       [], // Usabili anche dai piloti e manutentori
    maintainer: ['/manageDrones'] // Usabile anche dal base supervisor
}
/*
const roleToOperation_OLD = {
	AM:         ['/requestMission'],
	BS:         ['/createMission', '/acceptMission', '/addChiefPilot', '/addCoPilot', '/addCrew', '/addQtb'],
	pilot:      ['/addLogbook'],
    crew:       ['/accept', '/refuse'], // Usabili anche dai piloti e manutentori
    maintainer: ['/manageDrones'] // Usabile anche dal base supervisor
}*/

exports.genericCommands = genericCommands = ['/end', '/cancel', '/help', '/start']

/**
 * Funzione che restituisce i comandi che una certa persione può eseguire in base ai ruoli che ricopre
 * 
 * @param {Personnel} aPerson 
 */
const getPermissions = aPerson => {
    var commands = [];
    if (aPerson.roles.command.airOperator.AM)
        commands = commands.concat(roleToOperation.AM);
    if (aPerson.roles.command.base.supervisor)
        commands = commands.concat(roleToOperation.BS);
    if (aPerson.roles.occupation.pilot)
        commands = commands.concat(roleToOperation.pilot);
    if (aPerson.roles.occupation.pilot || aPerson.roles.occupation.crew || aPerson.roles.occupation.maintainer)
        commands = commands.concat(roleToOperation.crew);
    if (aPerson.roles.occupation.maintainer || aPerson.roles.command.base.supervisor)   // listDrones può essere eseguito da bs e maintainer
        commands = commands.concat(roleToOperation.maintainer)
    
    return commands;
};

/**
 * Funzione che recupera i dati di una persona dal db e li passa ad una funzione di callback
 */
exports.loadData = async idTelegram => {
    const aPerson = await Personnel.findByIdTelegram(idTelegram, '')
    return { commands: getPermissions(aPerson), person: aPerson }
}

/**
 * Funzione che ritorna il telegramId dell'utente
 * 
 * @param {Context} ctx Contesto del bot
 */
exports.getTelegramId = ctx => {
    return ctx.update[ctx.updateType].from.id
}

/**
 * Funzione che setta il bot come startato da una persona.
 * La persona ha già usato il comando /start.
 */
exports.setBotStarted = idTelegram => Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': true})

/**
 * Funzione che resetta il flag botStarted.
 */
exports.resetBotStarted = idTelegram => Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': false})





/**
 * Funzione che gira periodicamente e controlla quali sono le missioni che ci sono quel giorno:
 * 1. Controllo tra tutte le missioni quali sono quelle che ci sono quel giorno                             v
 * 2. Setto le missioni trovate come Started o richiedo all baseSup di settarle come Started                v
 * 3. Setto la missione come running per baseSup, pilot, crew e maintainer
 * 		-> Il 3 può essere inutile visto che c'è il campo Accepted che tiene anche la data della missione
 * 4. Setto il campo Personnel.missions.pilot.waitingForLogbook                                             v
 * 5. Setto ogni drone delle missioni di oggi come 'in missione' (availability = 1)                         v
 */ // IL PUNTO 3 PER ORA NON E' IMPLEMENTATO, PRIMA SI DECIDE SE GESTIRLO O NO
exports.checkTodaysMissions = async () => {
    timers.setInterval(async () => {
        // Cerco le missioni di oggi con il team già creato
        const today = new Date()
        const todaysMissions = await Mission.find({date: today, 'status.teamCreated.value': true}, '')
        // Queste missioni vengono settate come 'started'
        // Il controllo serve per evitare che venga eseguita la query sempre, così non viene emesso l'evento di modifica ogni volta
        if (todaysMissions.length > 0) {
            Mission.update({date: today, 'status.teamCreated': true},
                                         {$set: {'status.started.value': true,
                                                 'status.started.timestamp': Date.now()}})
        }
        // Per ogni missione di oggi
        for (const mission of todaysMissions) {
            // Setto i droni come 'in missione'
            for (const drone of mission.drones) {
                Drone.updateById(drone._id, {$set: {'state.availability': 1}})
            }
            // Setto il campo Personnel.missions.pilot.waitingForLogbook del chief pilot
            for (const team of mission.teams) {
                Personnel.updateById(team.pilots.chief, { $push: { 'missions.pilot.waitingForLogbook': mission._id }})
                Personnel.updateById(team.pilots.co,    { $push: { 'missions.pilot.waitingForLogbook': mission._id }})
            }
        }
    }, 60000)
}

/**
 * Funzione che controlla se una missione ha tutta la documentazione 
 * e nel caso la fa passare da WaitingForDocuments a Completed
 *  1. Controlla se ha 2 Logbook
 *  2. Controlla se ha tanti Qtb quanti Droni
 *  3. Se sono entrambe vere la missione è completata (Aggiunge un timestamp)
 * 
 *  @param {String} aMissionId Id della missione da controllare
 */
exports.checkMissionDocuments = async aMissionId => {
    const mission = await Mission.findById(aMissionId)
    if (mission.logbooks.length === 2*mission.teams.length && mission.qtbs.length === mission.drones.length) {
        Mission.updateById(mission._id, { $set: { 'status.waitingForDocuments.value': false, 'status.completed.value': true, 'status.completed.timestamp': new Date() }})
    }

}

/**
 * Funziona che controlla se c'è un numero sufficiente di persone per formare un team.
 * @param {ObjectId} missionId 
 */
exports.checkForTeam = async (aMission) => {
    const accepted = aMission.personnel.accepted
    
	if (accepted.length < 3) { return }

	// Se la missione dura meno di 3h
	if (aMission.description.duration.expected < 3) {
		let pilotCount = 0
		for (let person of accepted) {
			if (person.roles.includes('pilot')) { pilotCount++ }
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