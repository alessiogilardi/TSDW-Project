require('dotenv').config();
require('./db/db-connect.js').connect();
const Telegraf = require('telegraf');
const session = require('telegraf/session')
const dataLoader = require('./bot/data-loader-middleware');
const bf = require('./bot/bot-functions.js');
const Stage = require('telegraf/stage')
const createMission = require('./bot/commands/create-mission');
const requestMission = require('./bot/commands/request-mission')
const eventEmitters = require('./events/event-emitters')
const eventRegister = require('./events/event-register')
const { enter, leave } = Stage

const backtick = '\`';

// TODO: completare la notifica del supervisore quando è pronto un Team.
// TODO: aggiungere comando per creare un team una volta che ci sono sufficienti persone

// TODO: potrebbe essere possibile creare un middleware che controlla l'input,
// se è un comando allora verifica che l'utente sia autorizzato a lanciarlo altrimeni restituisce errore

// TODO: scelgo tra i piloti quelli adatti alla missione e scelgo il personale, poi il supervisore
// deciderà se assegnare un pilota alla crew, ma non potrà assegnare membri della crew ai piloti

// TODO: definire la possibilità che sia droni che piloti siano occupati in un altra missione per cui è inutile notificarli

const stage = new Stage([createMission, requestMission])
stage.command('cancel', leave())

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
eventRegister(bot)

// session({ ttl: 10 })
bot.use(session());
bot.use(dataLoader());
bot.use(stage.middleware())


bot.start(ctx => {
	if (ctx.session.userData.person.telegramData.botStarted)
		return
	ctx.reply(`Ciao ${ctx.message.from.first_name}!`)
	.then(() => ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`))
	.catch(err => console.log(err));
	bf.setBotStarted(ctx.message.from.id)
});
bot.help(ctx => ctx.reply(`Command list:\n${ctx.session.userData.commands.join('\n')}`));
// TODO: action -> delete non funziona -> Da verificare il tipo di action
// bot.action('delete', ctx => bf.resetBotStarted(ctx.message.from.id))

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

bot.on('callback_query', ctx => {
	// Rispondo alle actions dei Button ed emetto l'evento appropriato
	var cbQuery = JSON.parse(ctx.callbackQuery.data)
	ctx.answerCbQuery(cbQuery.cbMessage)
	ctx.editMessageReplyMarkup({})
	eventEmitters.Bot.emit(cbQuery.action, cbQuery.data, ctx)
})

bot.startPolling();