/**
 * 1. Ricevo _id della missione accetttata tramite callbackButton
 * 2. Aggiungo la missione a quelle accettate in
 *  	--> missions.accepted
 * 3. Aggiungo il Personale che ha accettato alla missione
 * 		--> rimuovo da personnel.notified
 * 		--> aggiungo in personnel.accepted
 * 4. Emetto l'evento onMissionAccepted
 */

const { unZip } = require('../bot-functions')
const { Personnel, Mission } = require('../../db/queries')
const ee = require('../../events/event-emitters')

/**
 * Funzione che esegue il parsing dei parametri passati tramite ctx.state
 * @param {Context} ctx 
 */
const parseParams = ctx => {
	const missionId = ctx.state.data[0]
	let roles = ctx.state.data[1].split(',') // Ruoli che può ricoprire nella missione
	for (let i in roles) {
		roles[i] = unZip[roles[i]]
	}

	this.missionId 	= missionId
	this.roles		= roles
}

/**
 * Funzione che esegue acceptMission
 * 	1. Aggiunge la missione a quelle accettate in Personnel
 * 	2. Aggiunge la persona a quelle che hanno accettato la missione in Mission
 * @param {Context} ctx 
 */
const acceptMission = async () => async ctx => {
	parseParams(ctx)
	ctx.answerCbQuery('Missione accettata')
	ctx.editMessageReplyMarkup({})

	const person 	= ctx.session.userData.person
	const aMission 	= await Mission.findById(this.missionId, '')

	Personnel.updateById(person._id, { $push: { 'missions.accepted': { idMission: aMission._id, date: aMission.date, roles: this.roles } } })
	// forse non serve rimuovere il personale dai notificati -> await Mission.updateById(aMission._id, { $pull: { 'personnel.notified': person._id } })
	await Mission.updateById(aMission._id, { $push: { 'personnel.accepted': { _id: person._id, roles: this.roles } } })

	ee.bot.emit('missionAccepted', aMission._id, person)
}



module.exports = acceptMission