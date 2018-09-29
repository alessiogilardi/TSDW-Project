require('dotenv').config();
require('./db/db-connect.js').connect();
const Telegraf = require('telegraf');
const queries = require('./db/queries.js');
const deasync = require('deasync');
const session = require('telegraf/session')
const dataLoader = require('./bot/data-loader-middleware');
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
bot.use(dataLoader());
bot.use(stage.middleware())


bot.start(ctx => {
	if (!ctx.session.userData.person.telegramData.botStarted) {
		ctx.reply(`Ciao ${ctx.message.from.first_name}!`)
		.then(() => ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`))
		.catch(err => console.log(err));
		bf.setBotStarted(ctx.message.from.id)
	}
});
bot.help(ctx => ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`));
// Da verificare il tipo di action
bot.action('delete', ctx => bf.resetBotStarted(ctx.message.from.id))
bot.command(['createMission', 'createmission'], ctx => {
	//if (ctx.session.userData.commands.includes(ctx.message.text))
		ctx.scene.enter('createMission');
	//else
		//ctx.reply('Mi spiace ma non hai i diritti per eseguire questo comando')
});

bot.startPolling();