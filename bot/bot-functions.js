const { Mission, Personnel, Drone } = require('../db/queries.js')
const timers    = require('timers')
const utils     = require('../utils.js')

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
    '9': 'addToTeam'
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
    addToTeam:          '9'
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
}

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
 * Funzione che controlla le missioni non istanziate ogni minuto e notifica l'AM dopo n minuti che non viene istanziata
 */
exports.checkOrganizeTimeout = async (bot) => {
    timers.setInterval(async () => {
        // Carico il file con i timeout
        let timeout_file = JSON.parse(fs.readFileSync('timeouts.json', 'utf8'))
        // Controllo le missioni
        let now = new Date().getTime()
        let missions = await Mission.find({'status.requested.value': true, 'status.waitingForTeam.value': false}, '')
        for (let m of missions) {
            let missionReq  = new Date(m.status.requested.timestamp).getTime()
            let missionDate = new Date(m.date).getTime()
            // Se la differenza tra la data della missione e la data della richiesta è minore di 12 ore, usiamo il timeout breve
            // altrimenti si usa il timeout lungo
            let timeout = 0
            if (missionDate - missionReq < 12 * 60 * 60 * 1000) // 12 ore * 60 min all'ora * 60 sec al min * 1000 msec al sec
                timeout = timeout_file.organize.short
            else
                timeout = timeout_file.organize.long
            // Se il timeout è superato, si notifica l'AM
            if (now - missionReq == timeout * 60000) { // il timeout è in minuti, quindi lo converto in msec per fare la sottrazione
                // invio notifica all'AM
                let am = await Personnel.find({'roles.command.airOperator.AM': true}, 'telegramData.idTelegram')
                bot.sendMessage(am.telegramData.idTelegram, 'Una missione non è ancora stata accettata dal responsabile di base')
            }
        }
        missions = []
    }, 1 * 60000)
}

/**
 * Funzione che, dopo un certo tempo e dopo aver notificato altre basi, se ancora non c'è il numero sufficiente di persone per
 * formare un team, notifica il base supervisor e chiede se vuole abortire al missione
 */
exports.checkGlobalTimeout = async (bot) => {
    timers.setInterval(async () => {
        // Carico il file con i timeout
        let timeout_file = JSON.parse(fs.readFileSync('timeouts.json', 'utf8'))
        // TODO implementazione
    }, 1 * 60000)
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
        let today = new Date().setHours(0, 0, 0, 0)
        let todaysMissions = await Mission.find({date: today, 'status.teamCreated.value': true}, '')
        // Queste missioni vengono settate come 'started'
        // Il controllo serve per evitare che venga eseguita la query sempre, così non viene emesso l'evento di modifica ogni volta
        if (todaysMissions.length > 0) {
            Mission.update({date: today, 'status.teamCreated': true},
                                         {$set: {'status.teamCreated.value': false,
                                                 'status.started.value': true,
                                                 'status.started.timestamp': Date.now()}})
        }
        // Per ogni missione di oggi
        for (let mission of todaysMissions) {
            // Setto i droni come 'in missione'
            for (let drone of mission.drones) {
                Drone.updateById(drone._id, {$set: {'state.availability': 1}})
            }
            // Setto il campo Personnel.missions.pilot.waitingForLogbook del chief pilot
            for (let team of mission.teams) {
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
    if (mission.logbooks.length === 2 && mission.qtbs.length === mission.drones.length) {
        Mission.updateById(mission._id, { $set: { 'status.waitingForDocuments.value': false, 'status.completed.value': true, 'status.completed.timestamp': new Date() }})
    }

}