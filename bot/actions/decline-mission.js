const { Mission, EventLog } = require('../../db/queries')

/**
 * Funzione che esegue il parsing dei parametri passati tramite ctx.state
 * @param {Context} ctx 
 */
const parseParams = ctx => {
	this.missionId 	= ctx.state.data[0]
}

const declineMission = async (ctx) => {
    parseParams(ctx)
    const person = ctx.person.userData
    Mission.updateById(this.missionId, { $push: { 'personnel.declined': { _id: person._id, timestamp: new Date() } }})
    EventLog.insert({ type: 'missionDeclined', actor: person._id, subject: {type: 'Mission', _id: this.missionId}, timestamp: new Date() })

}

module.exports = declineMission