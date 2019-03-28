require('dotenv').config()
const db 				= require('./db/db-connect.js')

const Telegraf 			= require('telegraf')
const session 			= require('telegraf/session')
const Stage 			= require('telegraf/stage')

const dataLoader 		= require('./bot/middlewares/data-loader')
const cmdPermissionChk	= require('./bot/middlewares/command-permission-check')

const bf 				= require('./bot/bot-functions.js')

const organizeMission 	= require('./bot/scenes/organize-mission')
const requestMission 	= require('./bot/scenes/request-mission')
const manageDrones 		= require('./bot/scenes/manage-drones')
const createTeam 		= require('./bot/scenes/create-team')
const addLogbook 		= require('./bot/scenes/add-logbook')
const addQtb 			= require('./bot/scenes/add-qtb')

const acceptMission 	= require('./bot/actions/accept-mission')
const declineMission 	= require('./bot/actions/decline-mission')
const abortMission		= require('./bot/actions/abort-mission')
const extendToBase		= require('./bot/actions/extend-mission-to-base')

const eventRegister 	= require('./events/event-register')

const router 			= require('./bot/router')

const organizeTimeout 	= require('./bot/timeouts/organize')
const globalTimeout 	= require('./bot/timeouts/global')
const extendTimeout 	= require('./bot/timeouts/extend')

const { leave } 		= Stage

const stage = new Stage([organizeMission, requestMission, createTeam, manageDrones, addLogbook, addQtb])
stage.command('cancel', leave())

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

eventRegister(bot)

// MIDDLEWARES
bot.use(session()) // è possibile impostare un tempo di vita della sessione: session({ ttl: 10 })
bot.use(dataLoader())
bot.use(cmdPermissionChk())
bot.use(stage.middleware())

// CHIAMATA DELLE FUNZIONI PERIODICHE
organizeTimeout(bot)
extendTimeout(bot)
globalTimeout(bot)
bf.checkTodaysMissions()

bot.start(async ctx => {
	if (ctx.session.userData.person.telegramData.botStarted) { return }
	
	await ctx.reply(`Ciao ${ctx.message.from.first_name}!`)
	await ctx.reply(`Command list:\n ${ctx.session.userData.commands.join('\n')}`)
	bf.setBotStarted(ctx.message.from.id)
})

bot.help(ctx => ctx.reply(`Command list:\n${ctx.session.userData.commands.join('\n')}`));

bot.command(['requestMission', 'requestmission'], ctx => {
	ctx.scene.enter('requestMission')
})

bot.command(['manageDrones', 'managedrones'], ctx => {
	ctx.scene.enter('manageDrones');
})

bot.command(['addLogbook', 'addlogbook'], ctx => {
	ctx.scene.enter('addLogbook')
})

bot.command(['addQtb', 'addqtb'], ctx => {
	ctx.scene.enter('addQtb')
})

router.on('organizeMission', ctx => {
	ctx.answerCbQuery(undefined)
	ctx.deleteMessage()
	bot.telegram.sendMessage(ctx.state.data[1], 'Missione accettata dal responsabile di base')
	ctx.scene.enter('organizeMission', { mission: { _id: ctx.state.data[0] } })
})

router.on('acceptMission', acceptMission())

router.on('declineMission', declineMission())

router.on('extendToBase', extendToBase())

router.on('abortMission', abortMission())

router.on('createTeam', ctx => {
	ctx.answerCbQuery(undefined)
	ctx.deleteMessage()
	
	ctx.scene.enter('createTeam', { mission: { _id: ctx.state.data[0] } })
})

bot.on('callback_query', router)

;(async () => {
	await db.connect(process.env.DB_ADDRESS, process.env.DB_PORT, process.env.DB_NAME)
	bot.startPolling()
	console.log('Bot Started!')
})()