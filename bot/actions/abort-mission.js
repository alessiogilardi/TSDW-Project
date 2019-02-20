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

// TODO: aggiungere possbilità di capire se l'Abort è stato fatto da BS o AM

const { Mission, Personnel, Base } = require('../../db/queries')
const utils = require('../../utils')

const sendMessage = async (idTelegram, message) => {
    this.ctx.telegram.sendMessage(idTelegram, message)
}

const notifyAM = async (AM, mission) => {
    const message = `La missione del ${utils.Date.format(mission.date, 'DD MMM YYYY kk:mm')} è stata annullata`
    sendMessage(AM.telegramData.idTelegram, message)
}

const notifyMainBaseSup = async (baseSup, mission) => {
    const message = `La missione del ${utils.Date.format(mission.date, 'DD MMM YYYY kk:mm')} è stata annullata`
    sendMessage(baseSup.telegramData.idTelegram, message)
}

const notifySupervisors = async (supervisors, mission, mainBase) => {
    const message = `La missione del ${utils.Date.format(mission.date, 'DD MMM YYYY kk:mm')} partita dalla Base: ${mainBase.name} è stata annullata`
    for (const person of supervisors) {
        sendMessage(person.telegramData.idTelegram, message)
    }
}

const notifyPersonnel = async (personnel, mission, mainBase) => {
    const message = `La missione del ${utils.Date.format(mission.date, 'DD MMM YYYY kk:mm')} partita dalla Base: ${mainBase.name} è stata annullata`
    for (const person of personnel) {
        sendMessage(person.telegramData.idTelegram, message)
    }
}

const parseParam = () => {
    this.missionId = this.ctx.state.data[0]
}

const abortMission = async () => async (ctx) => {
    this.ctx = ctx
    parseParam()
    ctx.answerCbQuery('Missione annullata')
    ctx.deleteMessage()
    
    const mission       = await Mission.findById(this.missionId, '')
    const AM            = await Personnel.findById(mission.AM, '')
    const mainBaseSup   = await Personnel.findById(mission.supervisor, '')
    const mainBase      = await Base.findById(mission.base)

    notifyAM(AM, mission)
    notifyMainBaseSup(mainBaseSup, mission)

    // Cerco i BS delle Basi contattate e li notifico
    ;(async () => {
        let supervisors = []
        const notifiedBasesIds = mission.notifiedBases.map(b => b._id)
        for (const baseId of notifiedBasesIds) {
            const base = await Base.findById(baseId, '')
            const supervisor = utils.copyObject(await Personnel.findById(base.supervisor))
            supervisors.push(supervisor)
        }
        notifySupervisors(supervisors, mission, mainBase)
    })()
    
    // Cerco il Personale che è stato notificato e non ha rifiutato la missione
    ;(async () => {
        // Ricavo gli _id di chi è stato notificato e non ha rifiutato
        const notifiedIds = new Set(mission.personnel.notified.map(p => p._id.toString()))
        const declinedIds = new Set(mission.personnel.declined.map(p => p._id.toString()))

        const personneIds = [...new Set([...notifiedIds].filter(p => !declinedIds.has(p)))]
        let   personnel   = []
        for (const p of personneIds) {
            const person = utils.copyObject(await Personnel.findById(p))
            personnel.push(person)
        }
        notifyPersonnel(personnel, mission, mainBase)
    })()

    // TODO: aggiungere update Personnel e rimuovere la missione abortita da quelle accettate dalla persona,
    // oppure aggiungere campo booleano

    Mission.updateById(mission._id, { $set: { 'status.aborted.value': true, 'status.aborted.timestamp': new Date() }})
    EventLog.insert({ type: 'missionAborted', actor: undefined, subject: {type: 'Mission', _id: this.missionId}, timestamp: new Date() })
}

module.exports = abortMission