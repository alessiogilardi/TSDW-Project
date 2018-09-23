require('dotenv').config();
const Telegraf = require('telegraf');
const queries = require('./queries.js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Dizionario che contiene per ogni ruolo la lista di operazioni (uniche) che può fare (probabilmente inutile, ma memorizza tutti i comandi esistenti e chi li può eseguire)
var role_to_operation = {
	AM: ['/requestMission'],
	BS: ['/createMission', '/acceptMission', '/addChiefPilot', '/addCoPilot', '/addCrew', '/addQtb'],
	pilot: ['/addLogbook'],
	crew: ['/accept', '/refuse']																// Usabili anche dai piloti
};

bot.start((ctx) => ctx.reply('Telegram bot started!'));
bot.help((ctx) => ctx.reply('Command list: '+findPermissions(ctx)));
bot.hears('Hi', (ctx) => {
    ctx.reply('Hey there');
    ctx.telegram.sendMessage(ctx.message.from.id, 'Ciao '+ctx.message.from.id);
});

bot.startPolling();

findPermissions = (ctx) => {
	var commandList = [];																		// Lista di comandi eseguibili da una certa persona
	// Recupero il documento della persona a partire dal suo id telegram
	projection = 'roles.command.airOperator.AM roles.command.base.supervisor roles.occupation.pilot roles.occupation.crew';
	queries.Personnel.findByIdTelegram(ctx.message.from.id, projection, aPerson => {
		console.log(aPerson);
		console.log('entrato');
		if (aPerson.roles.command.airOperator.AM)
			Array.prototype.push.apply(commandList, role_to_operation.AM)
		if (aPerson.roles.command.base.supervisor)
			Array.prototype.push.apply(commandList, role_to_operation.BS)
		if (aPerson.roles.occupation.pilot)
			Array.prototype.push.apply(commandList, role_to_operation.pilot)
		if (aPerson.roles.occupation.pilot || aPerson.roles.occupation.crew)
			Array.prototype.push.apply(commandList, role_to_operation.crew)
	});
	//console.log(commandList);
	return commandList;																			// non può funzionare per il solito motivo
};