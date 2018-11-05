const queries = require('../db/queries.js');

/**
 * Comandi conesentiti ad un certo ruolo
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
    queries.Personnel.findByIdTelegram(idTelegram, {}, aPerson => {
        callback({
            commands: getPermissions(aPerson),
            person: aPerson
        });
    });
};

/**
 * Funzione che setta il bot come startato da una persona.
 * La persona ha già usato il comando /start.
 */
exports.setBotStarted = idTelegram => queries.Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': true})

/**
 * Funzione che resetta il flag botStarted.
 */
exports.resetBotStarted = idTelegram => queries.Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': false})