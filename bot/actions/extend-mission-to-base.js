/**
 * Modulo che permette di estendere la richiesta di missione alle altre Basi
 *  1. Notifico il BS della Base selezionata
 *  2. Cerco tra il personale della Base e notifico le persone selezionate
 *  3. Aggiungo la base a notifiedBases in Missions
 */

const { Base, Mission, Personnel } = require('../../db/queries')
const utils = require('../../utils')

/**
 * Funzione che notifica il personale, mediante un messaggio Telegram.
 * @param {String}   idTelegram 
 * @param {String}   message 
 * @param {Array}    roles      Possibili ruoli che la persona può ricoprire nella missione
 * @param {ObjectId} missionId  _id della Missione
 */
const sendMessage = (idTelegram, message, roles, missionId) => {
    for (let i in roles) {
        roles[i] = zip[roles[i]];
    }
    
    this.ctx.telegram.sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup( m => m.inlineKeyboard([
            m.callbackButton('Accetta', `${zip['acceptMission']}:${missionId}:${roles.join(',')}`),
            m.callbackButton('Rifiuta', `${zip['declineMission']}:${missionId}`)
    ])))
}


/**
 * Funzione che notifica il personale.
 * 
 * @param {Personnel} persons 
 * @param {Mission}   mission 
 */
const notifyPersonnel = async (persons, mission) => {
    const r = ['pilot', 'crew', 'maintainer']
    for (let person of persons) {
        let roles = [person.roles.occupation.pilot, person.roles.occupation.crew, person.roles.occupation.maintainer]
        let tmp = []
        for (let i in roles) {
            if (roles[i]) { tmp.push(r[i]) }
        }
        roles = tmp
        //console.log(`Notifing in nearest base: ${person.name} ${person.surname} as ${roles}`)

        const message = `Richiesta di missione in una Base diversa dalla tua, come ${roles.join(', ')}:\n${utils.Date.format(mission.date, 'DD MMM YYYY')}\nScenario: ${mission.description.riskEvaluation.scenario}\nLivello: ${mission.description.riskEvaluation.level}`
        sendMessage(person.telegramData.idTelegram, message, roles, mission._id)
        Mission.updateById(mission._id, { $push: { 'personnel.notified': person._id } })
    }
}

/**
 * Funzione che cerca i membri disponibili in una base e li notifica.
 * @param {Base}    base 
 * @param {Mission} mission 
 */
const notifyBasePersonnel = async (base, mission) => {
    // Aggiungo la abse a quele notificate
    Mission.updateById(mission._id, { $push: { notifiedBases: { _id: base._id, timestamp: new Date() }}})

    // Vengono cercati tutti i membri del personale che ricoprono almeno uno dei ruoli pilota, crew, manutentore
    const selection = {
        base: base._id,
        $or: [{ 'roles.occupation.pilot': true }, { 'roles.occupation.crew': true }, { 'roles.occupation.maintainer': true }],
        'missions.accepted.date': {$ne: mission.date}
    }
    
    const persons = await Personnel.find(selection, '') // tutto il personale che può svolgere la missione
    notifyPersonnel(persons, mission)
}

/**
 * Parso i parametri: baseId e missionId da ctx
 */
const parseParams = () => {
    this.baseId     = this.ctx.state.data[0]
    this.missionId  = this.ctx.state.data[1]
}

/**
 * Funzione che invia notifica al BS della nuova Base
 * @param {*} telegramId 
 * @param {*} startBase 
 * @param {*} mission 
 */
const notifyBaseSupervisor = async (telegramId, startBase, mission) => {
    await this.ctx.telegram.sendMessage(telegramId, `La richiesta per la missione in data: ${utils.Date.format(mission.date, 'DD MMM YYYY kk:mm')} ` + 
    `partita dalla Base: ${startBase.name} è stata estesa alla tua Base.\n` +
    `Il personale sarà notificato.`)
}

const extendMissionToBase = async () => async (ctx) => {
    this.ctx = ctx
    // TODO: trovare un modo per disabilitare il button appena premuto
    ctx.answerCbQuery('Richiesta estesa')
    parseParams()

    const mission   = await Mission.findById(this.missionId, '')
    const startBase = await Base.findById(this.baseId, '')
    const newBase   = await Base.findById(this.baseId, '')
    const supervisor = await Personnel.findById(newBase.supervisor, '')

    notifyBaseSupervisor(supervisor.telegramData.telegramId, startBase, mission)
    notifyBasePersonnel(newBase, mission)

}

module.exports = extendMissionToBase