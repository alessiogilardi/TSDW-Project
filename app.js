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
const addQtb			= require('./bot/scenes/add-qtb')
const acceptMission 	= require('./bot/actions/accept-mission')
const eventRegister  	= require('./events/event-register')
const router		 	= require('./bot/router')
const deadlineCheck		= require('./bot/missions-deadline-check')
const { leave } 		= Stage


const backtick = '\`';

 // TODO: definire una funzione che fa passare le missioni started a waitingForDocuments e setta il timestamp -> FATTO quando si inserisce il primo QTB

const stage = new Stage([organizeMission, requestMission, createTeam, manageDrones, addLogbook, addQtb])
stage.command('cancel', leave())

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
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

// CHIAMATA DELLE FUNZIONI PERIODICHE
bf.checkTimeout(bot) // Funzione per il controllo del timeout dell'organizzazione delle missioni
bf.checkTodaysMissions() // Funzione per il controllo delle missioni odierne
deadlineCheck(bot, 120) // Funzione che controlla le missioni e notifica la base più vicina se il personale non ha risposto in tempo

bot.command(['requestMission', 'requestmission'], ctx => {
	if (!ctx.session.userData.commands.includes('/requestMission')) {
		ctx.reply('Mi spiace, non hai i diritti per eseguire questo comando.')
		return
	}
	ctx.scene.enter('requestMission')
})

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

bot.command(['addQtb', 'addqtb'], ctx => {
	if (!ctx.session.userData.commands.includes('/addQtb')) {
		ctx.reply('Mi spiace, non hai i diritti per eseguire questo comando.')
		return
	}
	ctx.scene.enter('addQtb')
})


//////////// DEGUGGING DA CANCELLARE ////////////////////
bot.hears(['A','a'], ctx => {
    ctx.reply('DEBUG: creazione team', Telegraf.Extra
		.markdown()
		.markup( m => m.inlineKeyboard([
			m.callbackButton('Accetta', `${zip['createTeam']}:${'5c5c06bbd9397029782fef6b'}`)
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
	ctx.answerCbQuery('Missione accettata')
	ctx.editMessageReplyMarkup({})
	acceptMission(bot, ctx)
})

router.on('declineMission', ctx => {
	ctx.deleteMessage()
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
