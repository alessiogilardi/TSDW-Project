require('dotenv').config();
require('./db/db-connect.js').connect();
const Telegraf = require('telegraf');
const queries = require('./db/queries.js');
const deasync = require('deasync');
const session = require('telegraf/session')
const middleware = require('./bot/telegraf-middleware');
const bf = require('./bot/bot-functions.js');
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const createMission = require('./bot/commands/create-mission');
const { enter, leave } = Stage

const backtick = '\`';


const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const stage = new Stage([createMission])
stage.command('cancel', leave())


// session({ ttl: 10 })
bot.use(session());
bot.use(middleware());
bot.use(stage.middleware())


bot.start(ctx => {
	if (!ctx.session.userData.telegramData.botStarted)
		ctx.reply(`Ciao ${ctx.message.from.first_name}!`)
		.then(() => ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`))
		.then(() => bf.setBotStarted(ctx.message.from.id))
		.catch(err => console.log(err));
});
bot.help(ctx => ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`));
bot.command(['createMission', 'createmission'], ctx => {
	ctx.scene.enter('createMission');
});

bot.startPolling();