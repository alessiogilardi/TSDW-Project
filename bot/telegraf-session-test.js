require('dotenv').config();
const Telegraf = require('telegraf');
require('./db-connect.js').connect();
const queries = require('./queries.js');
const deasync = require('deasync');
const session = require('telegraf/session')
const middleware = require('./telegraf-middleware');
const bf = require('./bot-functions.js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.use(session());
bot.use(middleware());

const backtick = '\`';

bot.start(ctx => {
	if (!ctx.session.userData.telegramData.botstarted)
		ctx.reply(`Ciao ${ctx.message.from.first_name}!`)
		.then(() => ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`))
		.then(() => bf.setBotStarted(ctx.message.from.id))
		.catch((err) => console.log(err));
});
bot.help(ctx => ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`));

bot.startPolling();


/*
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
*/

