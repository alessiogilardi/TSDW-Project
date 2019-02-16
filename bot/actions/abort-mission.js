/**
 * La generazione della Missione è stata interrotta perché non è stato trovato abbastanza personale.
 *  1. Devo notificare tutte le persone contattate in precedenza.
 *      1. L'AM che ha richiesto la Missione
 *      2. Il BS della base di partenza
 *      3. Gli eventuali BS delle Basi contattate in seguito
 *      4. Il personale che aveva accettato e quelli che non avevano risposto.
 *  2. Imposto la status.aborted.value = true in Mission
 *  3. Inserisco l'evento nell'EventLog
 */

const { Mission, Personnel, Base } = require('../../db/queries')

const notifyAM = async (AM, mission) => {

}

const notifyMainBaseSup = async (baseSup, mission) => {

}

const notifySupervisors = async (supervisors, mission) => {

}

const notifyPersonnel = async (personnel, mission) => {

}

const parseParam = () => {
    this.missionId = this.ctx.state.data[0]
}

const abortMission = async () => async (ctx) => {
    this.ctx = ctx
    parseParam(ctx)
    ctx.answerCbQuery('Missione annullata')
    ctx.deleteMessage()
    
    const mission       = await Mission.findById(this.missionId, '')
    const AM            = await Personnel.findById(mission.AM, '')
    const mainBaseSup   = await Personnel.findById(mission.supervisor, '')
    let   supervisors   = []
    for (const baseId of mission.notifiedBases) {
        const base = await Base.findById(baseId, '')
        supervisors.push(base.supervisor)
    }
    
    // restano da notificare i notified - declined
    const notifiedIds = new Set(mission.notified.map(p => p._id.toString()))
    const declinedIds = new Set(mission.declined.map(p => p._id.toString()))

    const toNotify = [...new Set([...notifiedIds].filter(p => !declinedIds.has(p)))]

    console.log(toNotify)
    

/*
    let personnelToNotify = []
    for (const p of mission.notified) {
        if (!declinedIds.includes(p._id.toString())) {
            personnelToNotify.push(p._id)
        }
    }
*/
}

module.exports = abortMission