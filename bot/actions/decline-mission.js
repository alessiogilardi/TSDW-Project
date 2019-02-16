const { Mission, EventLog } = require('../../db/queries')

/**
 * Funzione che esegue il parsing dei parametri passati tramite ctx.state
 * @param {Context} ctx 
 */
const parseParams = ctx => {
	this.missionId 	= ctx.state.data[0]
}

/**
 * Funzione che gestisce l'action declineMission.
 * La persona che rifiuta la missione viene aggiunta a personnel.declined in Mission e
 * inserisce l'evento nell'EventLog.
 * 
 * @param {Context} ctx
 */
const declineMission = async () => async (ctx) => {
    parseParams(ctx)
    ctx.answerCbQuery('Missione rifiutata')
    ctx.deleteMessage()
    
    const person = ctx.person.userData
    Mission.updateById(this.missionId, { $push: { 'personnel.declined': { _id: person._id, timestamp: new Date() } }})
    EventLog.insert({ type: 'missionDeclined', actor: person._id, subject: {type: 'Mission', _id: this.missionId}, timestamp: new Date() })
}

module.exports = declineMission