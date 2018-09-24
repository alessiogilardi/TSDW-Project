require('dotenv').config();
const Telegraf = require('telegraf');
require('./db-connect.js').connect();
const queries = require('./queries.js');
const deasync = require('deasync');
const session = require('telegraf/session')

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.use(session());
bot.use((ctx, next) => {
    loadUserData(ctx, next);
});

bot.start(ctx => ctx.reply('Bot started'));
bot.help(ctx => ctx.reply(`Command list: ${ctx.session.commandList}`));
bot.hears(['Ciao', 'ciao'], ctx => {
    console.log(ctx.message);
});
bot.hears(['Repeat', 'repeat'], ctx => {
    for (i = 0; i < 3; i++)
        ctx.reply('Ciao ' + ctx.message.from.first_name)
});

bot.startPolling();


var role_to_operation = {
	AM: ['/requestMission'],
	BS: ['/createMission', '/acceptMission', '/addChiefPilot', '/addCoPilot', '/addCrew', '/addQtb'],
	pilot: ['/addLogbook'],
	crew: ['/accept', '/refuse']																// Usabili anche dai piloti
};

loadUserData = (ctx, next) => {
    getPermissions(ctx.message.from.id, commandList => {
        ctx.session.commandList = commandList;
    });
    ctx.session.dataLoaded = true;
    next();
};

setBotStarted = (idTelegram) => {
    queries.Personnel.updateByIdTelegram(idTelegram, {'telegramData.botStarted': true});
};

getPermissions = (idTelegram, callback) => {
    var commandList = []; // Lista di comandi eseguibili da una certa persona
	// Recupero il documento della persona a partire dal suo id telegram
	projection = 'roles.command.airOperator.AM roles.command.base.supervisor roles.occupation.pilot roles.occupation.crew';
	queries.Personnel.findByIdTelegram(idTelegram, projection, aPerson => {
		if (aPerson.roles.command.airOperator.AM)
			Array.prototype.push.apply(commandList, role_to_operation.AM)
		if (aPerson.roles.command.base.supervisor)
			Array.prototype.push.apply(commandList, role_to_operation.BS)
		if (aPerson.roles.occupation.pilot)
			Array.prototype.push.apply(commandList, role_to_operation.pilot)
		if (aPerson.roles.occupation.pilot || aPerson.roles.occupation.crew)
            Array.prototype.push.apply(commandList, role_to_operation.crew)
        
        callback(commandList);
	});
}

