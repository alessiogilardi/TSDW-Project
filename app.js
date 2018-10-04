require('dotenv').config();
require('./db/db-connect.js').connect();
const Telegraf = require('telegraf');
const session = require('telegraf/session')
const dataLoader = require('./bot/data-loader-middleware');
const bf = require('./bot/bot-functions.js');
const Stage = require('telegraf/stage')
const createMission = require('./bot/commands/create-mission');
const requestMission = require('./bot/commands/request-mission')
const notification = require('./bot/notifications')
const { enter, leave } = Stage

const backtick = '\`';




// TODO: potrebbe essere possibile creare un middleware che controlla l'input,
// se è un comando allora verifica che l'utente sia autorizzato a lanciarlo altrimeni restituisce errore

// Il personale notificato a seguito della creazione di una missione 
// potrebbe non essere diviso per ruolo(pilota, crew, ...), in questo modo viene semplicemente mostrato al 
// supervisore ed è lui a scegliere come distribuire il personale
// Oppure scelgo tra i piloti quelli adatti alla missione e il personale, poi il supervisore può decidere di assegnare 
// un pilota alla crew ma non uno della crew ai piloti

// TODO: definire la possibilità che sia droni che piloti siano occupati in un altra missione per cui è inutile notificarli

const stage = new Stage([createMission, requestMission])
//const stage2 = new Stage([requestMission])					//TODO: gestire meglio gli stage
stage.command('cancel', leave())
//stage2.command('cancel', leave())

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
notification(bot)

// session({ ttl: 10 })
bot.use(session());
bot.use(dataLoader());
bot.use(stage.middleware())
//bot.use(stage2.middleware())								//TODO: gestire meglio i middleware per stage


bot.start(ctx => {
	if (ctx.session.userData.person.telegramData.botStarted)
		return
	ctx.reply(`Ciao ${ctx.message.from.first_name}!`)
	.then(() => ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`))
	.catch(err => console.log(err));
	bf.setBotStarted(ctx.message.from.id)
});
bot.help(ctx => ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`));
// Da verificare il tipo di action
bot.action('delete', ctx => bf.resetBotStarted(ctx.message.from.id))

bot.command(['createMission', 'createmission'], ctx => {
	if (!ctx.session.userData.commands.includes('/createMission')) {
		ctx.reply('Mi spiace, non hai i diritti per eseguire questo comando.')
		return
	}
	ctx.scene.enter('createMission');
});

bot.command(['requestMission', 'requestmission'], ctx => {
	if (!ctx.session.userData.commands.includes('/requestMission')) {
		ctx.reply('Mi spiace, non hai i diritti per eseguire questo comando.')
		return
	}
	ctx.scene.enter('requestMission');
});

bot.startPolling();