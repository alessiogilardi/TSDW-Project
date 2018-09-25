require('dotenv').config();
require('./db/db-connect.js').connect();
const Telegraf = require('telegraf');
const queries = require('./db/queries.js');
const deasync = require('deasync');
const session = require('telegraf/session')
const middleware = require('./bot/telegraf-middleware');
const bf = require('./bot/bot-functions.js');

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