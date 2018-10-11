require('dotenv').config();
require('./db/db-connect.js').connect();
const Telegraf = require('telegraf');
const session = require('telegraf/session')
const dataLoader = require('./bot/data-loader-middleware');
const bf = require('./bot/bot-functions.js');
const Stage = require('telegraf/stage')
const createMission = require('./bot/commands/create-mission');
const requestMission = require('./bot/commands/request-mission')
const notify = require('./bot/notifications/notify')
const { enter, leave } = Stage

const backtick = '\`';




// TODO: potrebbe essere possibile creare un middleware che controlla l'input,
// se è un comando allora verifica che l'utente sia autorizzato a lanciarlo altrimeni restituisce errore

// TODO: scelgo tra i piloti quelli adatti alla missione e scelgo il personale, poi il supervisore
// deciderà se assegnare un pilota alla crew, ma non potrà assegnare membri della crew ai piloti

// TODO: definire la possibilità che sia droni che piloti siano occupati in un altra missione per cui è inutile notificarli

// TODO: gestire accept e decline come risposte a pulsanti 
// in questo modo possono essere chiamati solo se si deve accettare una missione

const stage = new Stage([createMission, requestMission])
stage.command('cancel', leave())

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
notify(bot)

// session({ ttl: 10 })
bot.use(session(/*{ ttl: 10 }*/));
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
// TODO: action -> delete no funziona  Da verificare il tipo di action
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
/*
bot.hears('prova', ctx => {
	bot.telegram.sendMessage(ctx.message.from.id, 'Prova bottone', Telegraf.Extra
	.markup(m => m.inlineKeyboard([
		m.callbackButton('Test1 button', 'test1'),
		m.callbackButton('Test2 button', 'test2')
	])))
})

bot.action('test1', ctx => {
	console.log('Test1')
	ctx.answerCbQuery('Test1!')
})

bot.action('test2', ctx => {
	console.log('Test2')
	ctx.answerCbQuery('Test2!')
})
*/


/*
const testMenu = Telegraf.Extra
  .markdown()
  .markup((m) => m.inlineKeyboard([
    m.callbackButton('Test button', 'test')
  ]))

  /*
const aboutMenu = Telegraf.Extra
  .markdown()
  .markup((m) => m.keyboard([
    m.callbackButton('⬅️ Back')
  ]).resize())
*/
/*
bot.hears('test', (ctx) => {
  ctx.reply('test message', testMenu).then(() => {
    ctx.reply('about', aboutMenu)
  })
})
*/
/*bot.action('test', (ctx) => ctx.answerCbQuery('Yay!'))*/

