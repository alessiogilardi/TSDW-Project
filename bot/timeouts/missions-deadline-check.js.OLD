const Telegraf 		 	= require('telegraf')
const { Mission, Base } = require('../db/queries')
const moment            = require('moment')
const timers            = require('timers')
const utils             = require('../utils')

//const deadline = 120    // Tempo in minuti che deve passare da quando una missione è presa in carico per
                        // iniziare a notificare la base più vicina


/**
 * Funzione che calcola la distanza cartesiana (quadratica) tra due basi. 
 * @param {Base} base1 
 * @param {Base} base2 
 */
const computeDistance = (base1, base2) => {
    // Calcolo distanza cartesiana
    const lat1 = base1.location.coordinates.latitude
    const lat2 = base2.location.coordinates.latitude

    const lng1 = base1.location.coordinates.longitude
    const lng2 = base2.location.coordinates.longitude

    return (lat1-lat2)^2 + (lng1-lng2)^2
}

/**
 * Funzione che trova la base più vicina a quella con _id in argomento.
 * @param {ObjectId} baseId Id della base di cui trovare la più vicina
 */
const findNearestBase = async baseId => {
    const startBase = await Base.findById(baseId)
    const bases     = await Base.find({ _id: { $ne: baseId } }, '')

    // Per ogni base ne calcolo la distanza dalla mia base
    let minIndex = -1
    let minDistance = Infinity
    for (let i in bases) {
        let distance = computeDistance(startBase, bases[i])
        if (distance < minDistance) {
            minDistance = distance
            minIndex = i
        }
    }

    return bases[minIndex]
}

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
    
    this.bot.telegram.sendMessage(idTelegram, message, Telegraf.Extra
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
        console.log(`Notifing in nearest base: ${person.name} ${person.surname} as ${roles}`)

        let message = `Richiesta di missione come ${roles.join(', ')}:\n${utils.Date.format(mission.date, 'DD MMM YYYY')}\nScenario: ${mission.description.riskEvaluation.scenario}\nLivello: ${mission.description.riskEvaluation.level}`
        sendMessage(person.telegramData.idTelegram, message, roles, mission._id)
        Mission.updateById(mission._id, { $push: { 'personnel.notified': person._id } })
    }
}

/**
 * Funzione che cerca i membri disponibili in una base e li notifica.
 * @param {Base}    base 
 * @param {Mission} mission 
 */
const notifyBase = async (base, mission) => {
    // Sto notificando la base più vicina quindi non devo rifarlo, imposto notifiedNearestBase a true
    Mission.updateById(mission._id, { $set: { 'notifiedNearestBase.value': true, 'sizenotifiedNearestBase.timestamp': new Date() }})

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
 * Funzione che cerca tra le missioni, se qualcuna risulta organizzata, ma non si è ancora trovato personale sufficiente
 * entro una deadline allora passa a notificare anche i membri della base più vicina
 */
const missedDeadlines = async () => {
    let tempDate = new moment().subtract(this.deadline, 'm').toDate()
    const missions = await Mission.find({ 'notifiedNearestBase.value': false, 'status.waitingForTeam.value': true, 'status.teamCreated.value': false, 'status.waitingForTeam.timestamp': { $lt: tempDate } }, '')

    // DEBUG: 
    // console.log('Numero missioni con team-deadline superata: ' + missions.length)

    return missions
}

const periodicTask = async (bot, deadline) => {
    this.bot = bot
    this.deadline = deadline
    const period = 60000
    // per ogni missione trovo la base più vicina e notifico i piloti di quella base
    timers.setInterval(async () => {
        let missions = await missedDeadlines()
        for (let m of missions) {
            let nearestBase = await findNearestBase(m.base)
            notifyBase(nearestBase, m)
        }
    }, period)
}

module.exports = periodicTask