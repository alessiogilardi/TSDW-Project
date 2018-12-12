require('dotenv').config();
const db 			 = require('./db/db-connect.js')
const Telegraf 		 = require('telegraf');
const session 		 = require('telegraf/session')
const dataLoader	 = require('./bot/data-loader-middleware');
const bf 			 = require('./bot/bot-functions.js');
const Stage 		 = require('telegraf/stage')
const organizeMission = require('./bot/scenes/organize-mission');
const requestMission = require('./bot/scenes/request-mission')
const eventEmitters	 = require('./events/event-emitters')
const eventRegister  = require('./events/event-register')
const router		 = require('./bot/router')
const { enter, leave } = Stage

const queries = require('./db/queries')
const Personnel = queries.Personnel
const Mission = queries.Mission

const backtick = '\`';

// TODO: completare la notifica del supervisore quando è pronto un Team.
// TODO: aggiungere comando per creare un team una volta che ci sono sufficienti persone

// TODO: potrebbe essere possibile creare un middleware che controlla l'input,
// se è un comando allora verifica che l'utente sia autorizzato a lanciarlo altrimeni restituisce errore

// TODO: scelgo tra i piloti quelli adatti alla missione e scelgo il personale, poi il supervisore
// deciderà se assegnare un pilota alla crew, ma non potrà assegnare membri della crew ai piloti

// TODO: definire la possibilità che sia droni che piloti siano occupati in un altra missione per cui è inutile notificarli

const stage = new Stage([organizeMission, requestMission])
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

/*
bot.command(['createMission', 'createmission'], ctx => {
	if (!ctx.session.userData.commands.includes('/createMission')) {
		ctx.reply('Mi spiace, non hai i diritti per eseguire questo comando.')
		return
	}
	ctx.scene.enter('createMission');
});
*/

// Chiamo la funzione per il timeout delle missioni
bf.checkTimeout()

bot.command(['requestMission', 'requestmission'], ctx => {
	if (!ctx.session.userData.commands.includes('/requestMission')) {
		ctx.reply('Mi spiace, non hai i diritti per eseguire questo comando.')
		return
	}
	ctx.scene.enter('requestMission');
});


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
////////////////////////////////////////////////////////

router.on('organizeMission', ctx => {
	// Entro nella scene: OrganizeMission
	//ctx.answerCbQuery({})
	ctx.deleteMessage()
	//ctx.editMessageReplyMarkup({})
	bot.telegram.sendMessage(ctx.state.data[1], 'Missione accettata dal responsabile di base')
	ctx.scene.enter('organizeMission', { mission: { _id: ctx.state.data[0] } })
})

router.on('acceptMission', async ctx => {
	/**
	 * 1. Ricevo _id della missione accetttata tramite callbackButton
	 * 2. Aggiungo la missione a quelle accettate in
	 *  	--> missions.accepted
	 * 3. Aggiungo il Personale che ha accettato alla missione
	 *    seguendo regole simili a quelle sopra
	 * 		--> rimuovo da personnel.notified
	 * 		--> aggiungo in personnel.accepted
	 * 4. Man mano che le persone accettano controllo quanti hanno
	 * 	  accettato finora e nel caso notifico il baseSup
	 * 		Se:
	 * 			- La missione dura meno di 3h:
	 * 				1. Ci sono almeno 3 persone
	 * 				2. Almeno 2 possono fare i piloti
	 * 					--> Notifico il baseSup della missione per la scelta del Team
	 * 			- La missione dura più di 3h
	 * 				1. Ci sono almeno 4 persone
	 * 				2. Almeno 2 possono fare i piloti
	 * 				3. Almeno 1 può fare il manutentore
	 * 					--> Notifico il baseSup della missione per la scelta del Team
	 * 
	 * NOTA: il baseSup sceglierà i ruoli che ognuno avrà nella
	 * 		 missione a sua discrezione
	 */
	
	const missionId = ctx.state.data[0]
	const roles 	= ctx.state.data[1].split(',') // Ruoli che può ricoprire nella missione
	const person 	= ctx.session.userData //.telegramData.idTelegram
	
	let aMission 	= await Mission.findById(missionId, '')

	await Personnel.updateById(person._id, { $push: { 'accepted.idMission': aMission._id, date: aMission.date, roles: roles } })
	await Mission.updateById(aMission._id, { $pull: { 'personnel.notified': person._id } })
	await Mission.updateById(aMission._id, { $push: { 'personnel.accepted': person._id } })

	// Cerco le persone che hanno accettato
	let aMission = await Mission.findById(missionId, '')
	let accepted = aMission.personnel.accepted
	if (aMission.description.duration.expected < 3) {
		
	} else {

	}


})

router.on('declineMission', ctx => {
	const data = ctx.state.data
})

bot.on('callback_query', router)

db.connect(process.env.DB_ADDRESS, process.env.DB_PORT, process.env.DB_NAME)
.then(() => {
	console.log('Bot started!')
	bot.startPolling()
})
