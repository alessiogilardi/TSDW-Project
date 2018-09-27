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

/*
const createMission = new WizardScene('createMission',
    ctx => {
        ctx.reply('Bene, iniziamo la creazione della missione!\nTi ricordo che puoi annullare in qualsiasi momento usando il comando /cancel')
        .then(() => ctx.reply('Ti verrà ora chiesto di inserire alcuni parametri.')
        .then(() => ctx.reply('Inserisci la data della missione:'))
        .then(() => ctx.wizard.next()))
        .catch(err => console.log(err));
    },
    ctx => {
        ctx.session.command.params.date = ctx.message.text;
        ctx.session.command.stage = 2;
        ctx.reply('Ok, inserisci ora la durata prevista della missione:')
        .then(() => ctx.wizard.next())
        .catch(err => console.log(err));
    },
    ctx => {
        ctx.session.command.params.expectedDuration = ctx.message.text;
        ctx.session.command.stage = 3;
        //console.log(ctx.session.command)
        ctx.reply('Bene abbiamo quasi finito.\nSolo qualche altra informazione.')
        .then(() => ctx.reply('Che Rank ha la missione?\nIn questo modo potrò scegliere tra i piloti adatti.'))
        .then(() => ctx.wizard.next())
        .catch(err => console.log(err));
    },
    ctx => {
        if (ctx.message.text == 5) {
            ctx.session.command.params.rank = ctx.message.text;
            ctx.session.command.stage = 4;
            ctx.reply('Un\'ultima domanda. Quale tipo di drone occorre usare per questa missione?')
            .then(() => ctx.reply('Potrai segliere tra un elenco di quelli disponibili in base al tipo scelto.'))
            .then(() => ctx.wizard.next())
            .catch(err => console.log(err));
        } else {
            // Modo errato di gestire la cosa
            // Inserire un metodo per capire quando entro nella funzione se ci sono entrato 
            // dopo un errore o se è la prima volta
            ctx.wizard.back();
        }
    },
    ctx => {
        ctx.session.command.params.droneTypes = ctx.message.text;
        ctx.session.command.stage = 5;
        ctx.reply('Quali droni vuoi utilizzare? Inserisci i loro numeri separandoli con una virgola.')
        .then(ctx.wizard.next())
        .catch(err => console.log(err));
    },
    ctx => {
        ctx.session.command.params.drones.push(ctx.message.text);
        ctx.session.command.stage = 6;
        console.log('Stage numero: ' + ctx.session.command.stage);
        ctx.reply('Abbiamo terminato, ora notificherò il personale.\nTi contatterò quando avremo un numero sufficiente di persone disponibili')
        .then(ctx.wizard.next())
        .catch(err => console.log(err));
    }
);

createMission.leave(ctx => {
    // Controllo il numero di stage e in base a quello capisco se l'inserimento è andato a buon fine
    // o se è stato annullato
    if (ctx.session.command.stage == 6)
        ctx.reply('Missione istanziata')
        .then(ctx.reply(JSON.stringify(ctx.session.command)))
        .catch(err => console.log(err))
    else
        ctx.reply('Creazione annullata');
});
*/
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

/*
// Gestione comandi BOT 
// Definisco lo stage
const stage = new Stage()
stage.command('cancel', leave())
bot.use(stage.middleware());
// createMission
// Definisco la scena per il comando
const createMission = new WizardScene('createMission', 
	ctx => {
		console.log('ciao');
		ctx.reply('Stage1');
		ctx.wizard.next();
	},
	ctx => {
		ctx.reply('Stage2')
	}
);
stage.register(createMission);


createMission.enter(ctx => {
	//console.log(ctx.session);
	ctx.session.command = {
		name: 'createMission',
		stage: 1,
		params: {
			baseId: undefined,
			baseSupervisor: undefined,
			date: undefined,
			expectedDuration: undefined,
			rank: undefined,
			droneTypes: undefined,
			drones: []
		}
	};
	ctx.reply('OK, inziamo la creazione di una nuova missione.\nTi verrà chiesto di iserire alcuni parametri')
	.then(() => ctx.reply('Inserisci la data in cui verrà effettuata la missione:'))
	.catch(err => console.log(err));
});
createMission.leave(ctx => {
	ctx.session.command.name = undefined;
	ctx.session.command.stage = undefined;
	ctx.session.command.params = undefined;
	ctx.reply('Fine operazione');
});
*/


// Quando viene lanciato il comando /createMission registro la scena corrispondente e ci entro
