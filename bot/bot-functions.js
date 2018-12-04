const queries   = require('../db/queries.js')
const Personnel = queries.Personnel

/**
 * Dizionario usato per de-comprimenre i nomi delle actions per evitare il limite di 64 byte
 * Nel caso si può aumentare la compressione dei nomi delle action
 */
exports.unZip = unZip = {
    orgMiss: 'organizeMission',
    accMiss: 'acceptMission',
    decMiss: 'declineMission'
}
/**
 * Dizionario usato per comprimenre i nomi delle actions per evitare il limite di 64 byte
 * Nel caso si può aumentare la compressione dei nomi delle action
 */
exports.zip = zip = {
    organizeMission: 'orgMiss',
    acceptMission:   'accMiss',
    declineMission:  'decMiss'
}

/**
 * Comandi consentiti ad un certo ruolo
 */
const roleToOperation = {
	AM:     ['/requestMission'],
	BS:     ['/createMission', '/acceptMission', '/addChiefPilot', '/addCoPilot', '/addCrew', '/addQtb'],
	pilot:  ['/addLogbook'],
	crew:   ['/accept', '/refuse'] // Usabili anche dai piloti e manutentori
};

/**
 * Funzione che restituisce i comandi che una certa persione può eseguire in base ai ruoli che ricopre
 * 
 * @param {} aPerson 
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
    
    return commands;
};

/**
 * Funzione che recupera i dati di una persona dal db e li passa ad una funzione di callback
 */
exports.loadData = (idTelegram, callback) => {
    return new Promise((resolve, reject) => {
        Personnel.findByIdTelegram(idTelegram, {})
        .then(aPerson => {
            resolve({
                commands: getPermissions(aPerson),
                person: aPerson
            })
        })
        .catch(err => console.log(err))
    })
}

/**
 * Funzione che setta il bot come startato da una persona.
 * La persona ha già usato il comando /start.
 */
exports.setBotStarted = idTelegram => queries.Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': true})

/**
 * Funzione che resetta il flag botStarted.
 */
exports.resetBotStarted = idTelegram => queries.Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': false})