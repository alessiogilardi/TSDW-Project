const { Mission, Personnel, Drone } = require('../db/queries.js')
const timers    = require('timers')
const utils     = require('../utils.js')

/**
 * Dizionario usato per de-comprimere i nomi delle actions per evitare il limite di 64 byte
 * Nel caso si può aumentare la compressione dei nomi delle action
 */
exports.unZip = unZip = {
    orgMiss:    'organizeMission',
    accMiss:    'acceptMission',
    decMiss:    'declineMission',
    aDrn2Msn:   'addDroneToMission',
    creTm:      'createTeam'
}
/**
 * Dizionario usato per comprimenre i nomi delle actions per evitare il limite di 64 byte
 * Nel caso si può aumentare la compressione dei nomi delle action
 */
exports.zip = zip = {
    organizeMission:    'orgMiss',
    acceptMission:      'accMiss',
    declineMission:     'decMiss',
    addDroneToMission:  'aDrn2Msn',
    createTeam:         'creTm'
}

/**
 * Comandi consentiti ad un certo ruolo
 */
const roleToOperation = {
	AM:         ['/requestMission'],
	BS:         ['/createMission', '/acceptMission', '/addChiefPilot', '/addCoPilot', '/addCrew', '/addQtb'],
	pilot:      ['/addLogbook'],
    crew:       ['/accept', '/refuse'], // Usabili anche dai piloti e manutentori
    maintainer: ['/manageDrones'] // Usabile anche dal base supervisor
};

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
 * Funzione che setta il bot come startato da una persona.
 * La persona ha già usato il comando /start.
 */
exports.setBotStarted = idTelegram => Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': true})

/**
 * Funzione che resetta il flag botStarted.
 */
exports.resetBotStarted = idTelegram => Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': false})

/**
 * Funzione che controlla le missioni non istanziate ogni minuto e notifica l'AM dopo 15 minuti che non viene istanziata
 */
exports.checkTimeout = async () => {
    timers.setInterval(async () => {
        let now = new Date().getMinutes()
        let missions = await Mission.find({'status.requested.value': true, 'status.waitingForTeam.value': false}, 'status.requested.timestamp')
        for (let m of missions) {
            let missionDate = new Date(m.status.requested.timestamp).getMinutes()
            if (now - missionDate == 1) { // DEBUG: cambiare in 15 minuti
                // invio notifica all'AM
                console.log(m)
            }
        }
        missions = []
    }, 60000)
}

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
        let today = utils.Date.parse(new Date().setHours(0, 0, 0, 0))
        let todaysMissions = await Mission.find({date: today, 'status.teamCreated.value': true}, '')
        // Queste missioni vengono settate come 'started'
        // Il controllo serve per evitare che venga eseguita la query sempre, così non viene emesso l'evento di modifica ogni volta
        if (todaysMissions.length > 0) {
            await Mission.update({date: today, 'status.teamCreated': true},
                                         {$set: {'status.teamCreated.value': false,
                                                 'status.started.value': true,
                                                 'status.started.timestamp': Date.now()}})
        }
        // Per ogni missione di oggi
        for (let mission of todaysMissions) {
            // Setto i droni come 'in missione'
            for (let drone of mission.drones)
                await Drone.updateById(drone._id, {$set: {'state.availability': 1}})
            // Setto il campo Personnel.missions.pilot.waitingForLogbook del chief pilot
            for (let team of mission.teams)
                await Personnel.updateById(team.pilots.chief, {$push: {'missions.pilot.waitingForLogbook': mission._id}})
        }
    }, 60000)
}

/**
 * Funzione che controlla se una missione ha tutta la documentazione 
 * e nel caso la fa passare da WaitingForDocuments a Completed
 *  1. Controlla se ha 2 Logbook
 *  2. Controlla se ha tanti Qtb quanti Droni
 *  3. Se sono entrambe vere la missione è completata (Aggiungere timestamp)
 */
exports.checkMissionDocuments = async aMissionId => {
    const mission = await Mission.findById(aMissionId)
    if (mission.logbooks.length === 2 && mission.qtbs.length === mission.drones.length) {
        Mission.updateById(mission._id, { 'status.waitingForDocuments.value': false, 'status.completed.value': true, 'status.completed.timestamp': new Date()})
    }

}