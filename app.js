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
const { leave } = Stage

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// session({ ttl: 10 })
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

var createMissionMaxStage = 5;

/* Gestione comandi BOT */
// Definisco lo stage
const stage = new Stage()
stage.command('cancel', leave())
bot.use(stage.middleware());
// createMission
// Definisco la scena per il comando
const createMission = new Scene('createMission');
createMission.enter(ctx => {
	console.log(ctx.session);
	ctx.session.command.name = 'createMission';
	ctx.session.command.stage = 1;
	ctx.session.command.params = {
		baseId: undefined,
		baseSupervisor: undefined,
		date: undefined,
		expectedDuration: undefined,
		rank: undefined,
		droneTypes: undefined,
		drones: []
	}
	ctx.reply('Ok, inserisci la data della missione');
});
createMission.leave(ctx => {
	ctx.session.command.name = undefined;
	ctx.session.command.stage = undefined;
	ctx.session.command.params = undefined;
	ctx.reply('Fine operazione');
});
// Implemento i vari passi per eseguire il comando
createMission.on('text', ctx => {
	switch (ctx.session.command.stage) {
		case 1:
			ctx.session.command.params.date = new Date(ctx.message.text);
			ctx.session.command.stage++;
			ctx.reply('Bene, ora iserisci la durata aspettata');
			break;
		case 2:
			ctx.session.command.params.expectedDuration = ctx.message.text;
			ctx.session.command.stage++;
			ctx.reply('Ottimo, ora iserisci la difficoltà');
			break;
		case 3:
			ctx.session.command.params.rank = ctx.message.text;
			ctx.session.command.stage++;
			ctx.reply('Inserisci i tipi di drone che verranno utilizzati');
			break;
		case 4:
			ctx.session.command.params.droneTypes = ctx.message.text;
			ctx.session.command.stage++;
			ctx.reply('Ecco una lista di droni disponibili');
			break;
		case 5:
			// Query al db per vedere i droni disponibili in base ai parametri della missione
			var drones = queries.Drone.findByTypeSync(ctx.session.command.params.droneTypes);
			ctx.reply(JSON.stringify(drones))
			.then(() => ctx.reply('Infine, inserisci i droni'))
			.catch(err => console.log(err));
			break;
		case 6:
			ctx.session.command.params.drones = ctx.message.text;
			ctx.session.command.stage++;
			ctx.scene.leave();
			break;
	}
});

// Quando viene lanciato il comando /createMission registro la scena corrispondente e ci entro
bot.command('createMission', ctx => {
	stage.register(createMission);
	ctx.scene.enter('createMission');
});

bot.startPolling();