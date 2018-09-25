const queries = require('./queries.js');

const roleToOperation = {
	AM:     ['/requestMission'],
	BS:     ['/createMission', '/acceptMission', '/addChiefPilot', '/addCoPilot', '/addCrew', '/addQtb'],
	pilot:  ['/addLogbook'],
	crew:   ['/accept', '/refuse'] // Usabili anche dai piloti e manutentori
};

exports.loadData = (idTelegram, callback) => {
    queries.Personnel.findByIdTelegram(idTelegram, {}, aPerson => {
        callback({
            commands: getPermissions(aPerson),
            telegramData: aPerson.telegramData
        });
    });
};

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

exports.setBotStarted = idTelegram => {
    // console.log('FakeFunction doing nothing!');
    queries.Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': true});
};