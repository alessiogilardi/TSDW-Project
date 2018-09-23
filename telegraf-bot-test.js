require('dotenv').config();
const Telegraf = require('telegraf');
require('./db-connect.js').connect();
const queries = require('./queries.js');
const deasync = require('deasync');
const session = require('telegraf/session')

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
bot.context.prova = 0;
bot.use(session());
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
	ctx.session.pippo = ctx.session.pippo || 0;
  	ctx.session.pippo++;
  	return ctx.reply('Message counter: ' + ctx.session.pippo);
});

bot.startPolling();

findPermissions = (ctx) => {
	var commandList = [];																		// Lista di comandi eseguibili da una certa persona
	// Recupero il documento della persona a partire dal suo id telegram
	projection = 'roles.command.airOperator.AM roles.command.base.supervisor roles.occupation.pilot roles.occupation.crew';
	queries.Personnel.findByIdTelegram(ctx.message.from.id, projection, aPerson => {
		if (aPerson.roles.command.airOperator.AM)
			Array.prototype.push.apply(commandList, role_to_operation.AM)
		if (aPerson.roles.command.base.supervisor)
			Array.prototype.push.apply(commandList, role_to_operation.BS)
		if (aPerson.roles.occupation.pilot)
			Array.prototype.push.apply(commandList, role_to_operation.pilot)
		if (aPerson.roles.occupation.pilot || aPerson.roles.occupation.crew)
			Array.prototype.push.apply(commandList, role_to_operation.crew)
	});
	while (commandList.length === 0)
		deasync.runLoopOnce();
	console.log(commandList);
	return commandList;																			// non può funzionare per il solito motivo
};