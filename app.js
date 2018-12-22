require('dotenv').config()
const db 			 	= require('./db/db-connect.js')
const Telegraf 		 	= require('telegraf')
const session 		 	= require('telegraf/session')
const dataLoader	 	= require('./bot/middlewares/data-loader')
const bf 			 	= require('./bot/bot-functions.js')
const Stage 		 	= require('telegraf/stage')
const organizeMission 	= require('./bot/scenes/organize-mission')
const requestMission 	= require('./bot/scenes/request-mission')
const manageDrones      = require('./bot/scenes/manage-drones')
const createTeam 		= require('./bot/scenes/create-team')
const addLogbook 		= require('./bot/scenes/add-logbook')
const acceptMission 	= require('./bot/actions/accept-mission')
const eventRegister  	= require('./events/event-register')
const router		 	= require('./bot/router')
const { leave } 		= Stage



const backtick = '\`';

/**
 * TODO: definire una funzione che gira periodicamente e controlla quali sono le missioni che ci sono quel giorno:
 * 1. Controllo tra tutte le missioni quali sono quelle che ci sono quel giorno
 * 2. Setto le missioni trovate come Started o richiedo all baseSup di settarle come Started
 * 3. Setto la missione come running per baseSup, pilot, crew e maintainer
 * 		-> Il 3 può essere inutile visto che c'è il campo Accepted che tiene anche la data della missione
 * 4. Setto il campo Personnel.missions.pilot.waitingForLogbook
 */

 // TODO: definire una funzione che fa passare le missioni started a waitingForDocuments e setta il timestamp

 // TODO: rivedere in Mission.waitingForDocuments e dividere per logBook e Qtb altrimenti non so quando mettere
 // la missione come completed, si potrebbe anche controllare ogni volta che inserisco un Logbook o Qtb se ho 2 logbook 
 // e Qtb pari al numero di droni in quella missione
 // TODO: rivedere Mission.logbooks


// TODO: potrebbe essere possibile creare un middleware che controlla l'input,
// se è un comando allora verifica che l'utente sia autorizzato a lanciarlo altrimeni restituisce errore


// TODO: definire la possibilità che sia droni che piloti siano occupati in un altra missione per cui è inutile notificarli

const stage = new Stage([organizeMission, requestMission, createTeam, manageDrones, addLogbook])
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

// Chiamo la funzione per il timeout delle missioni
bf.checkTimeout()

bot.command(['requestMission', 'requestmission'], ctx => {
	if (!ctx.session.userData.commands.includes('/requestMission')) {
		ctx.reply('Mi spiace, non hai i diritti per eseguire questo comando.')
		return
	}
	ctx.scene.enter('requestMission');
});

bot.command(['manageDrones', 'managedrones'], ctx => {
	if (!ctx.session.userData.commands.includes('/manageDrones')) {
		ctx.reply('Mi spiace, non hai i diritti per eseguire questo comando.')
		return
	}
	ctx.scene.enter('manageDrones');
})

bot.command(['addLogbook', 'addlogbook'], ctx => {
	if (!ctx.session.userData.commands.includes('/addLogbook')) {
		ctx.reply('Mi spiace, non hai i diritti per eseguire questo comando.')
		return
	}
	ctx.scene.enter('addLogbook')
})


//////////// DEGUGGING DA CANCELLARE ////////////////////
bot.hears(['A','a'], ctx => {
    var message = 'Vuoi iniziare ad organizzare la missione?'
    var buttonText = 'Organizza'
    var buttonData = zip['organizeMission'] + ':' + '5c092341589dce22acc1f9ef' + ':' + 33017299
    ctx.reply(message, Telegraf.Extra
    .markdown()
    .markup(m => m.inlineKeyboard([
        m.callbackButton(buttonText, buttonData)
	])))
})
/*
bot.hears(['b', 'B'], ctx => {
	let sendMsg = bot.telegram.sendMessage
	sendMsg(33017299, 'Message')
})
*/
////////////////////////////////////////////////////////

router.on('organizeMission', ctx => {
	// Entro nella scene: OrganizeMission
	//ctx.answerCbQuery({})
	ctx.deleteMessage()
	//ctx.editMessageReplyMarkup({})
	bot.telegram.sendMessage(ctx.state.data[1], 'Missione accettata dal responsabile di base')
	ctx.scene.enter('organizeMission', { mission: { _id: ctx.state.data[0] } })
})

router.on('acceptMission', ctx => {
	acceptMission(bot, ctx)
})

router.on('declineMission', ctx => {
	const data = ctx.state.data
})

router.on('createTeam', ctx => {
	ctx.scene.enter('createTeam', { mission: { _id: ctx.state.data[0] }})
})

bot.on('callback_query', router)

db.connect(process.env.DB_ADDRESS, process.env.DB_PORT, process.env.DB_NAME)
.then(() => {
	console.log('Bot started!')
	bot.startPolling()
})
