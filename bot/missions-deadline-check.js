const { Mission, Base } = require('../db/queries')
const moment = require('moment')
const timers = require('timers')



const deadline = 120    // Tempo in minuti che deve passare da quando una missione è presa in carico per
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
    const startBase = await Base.find({ _id: baseId })
    const bases = await Base.find({ _id: { $neq: baseId } }, '')

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
 * Funzione che manda un messaggio al membro del personale con due bottoni per accettare o rifiutare la missione.
 * @param {String} idTelegram 
 * @param {String} message 
 * @param {Array}  roles        Possibili ruoli che la persona può ricoprire nella missione
 */
const sendMessage = (idTelegram, message, roles) => {
    this.bot.telegram.sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup( m => m.inlineKeyboard([
            m.callbackButton('Accetta', `${zip['acceptMission']}:${mission._id}:${roles.join(',')}`),
            m.callbackButton('Rifiuta', `${zip['declineMission']}:${mission._id}`)
    ])))
}

/**
 * Funzione che notifica il personale.
 * 
 * @param {Personnel} persons 
 * @param {Mission}   mission 
 */
// TODO: formatta output Missione
const notifyPersonnel = async (persons, mission) => {
    const r = ['pilot', 'crew', 'maintainer']
    for (let person of persons) {
        let roles = [person.roles.occupation.pilot, person.roles.occupation.crew, person.roles.occupation.maintainer]
        let tmp = []
        for (let i in roles) {
            if (roles[i]) { tmp.push(r[i]) }
        }
        roles = tmp
        console.log(`Notifing: ${person} as ${roles}`)
        sendMessage(person.telegramData.idTelegram, `Richiesta di missione come ${roles.join(',')}:\n${mission}`)
        Mission.updateById(mission._id, { $push: { 'personnel.notified': person._id } })
    }
}

/**
 * Funzione che cerca i membri disponibili in una base e li notifica.
 * @param {Base}    base 
 * @param {Mission} mission 
 */
const notifyBase = async (base, mission) => {
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
    let tempDate = new moment().subtract(deadline, 'm').toDate()
    const missions = await Mission.find({ 'status.waitingForTeam.value': true, 'status.teamCreated.value': false, 'status.waitingForTeam.timestamp': { $lt: tempDate } }, '')

    return missions
}

const periodicTask = async bot => {
    this.bot = bot
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