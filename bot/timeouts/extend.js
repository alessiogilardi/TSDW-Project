/**
 * Modulo che controlla il Timeout Extend e se è stato superato notifica il BS chiedendogli se vuole
 * inviare la richiesta alle Basi vicine.
 * Se supero il Timeout:
 *  1. Il BS riceve un messaggio con l'elenco delle Basi, ad ogni Base è assegnato un Button
 *  2. Premendo il Button vengono notificati:
 *      - Il BS della base relativa
 *      - Il personale di quella Base
 *  3. Aggiungo la Base all'elenco delle Basi notificate in Mission.notifiedBases
 */
const Telegraf 		 	= require('telegraf')
const { Mission, Base } = require('../../db/queries')
const moment            = require('moment')
const timers            = require('timers')
const utils             = require('../utils')
const fs                = require('fs')

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

/**
 * Funzione che cerca tra le Missioni e recupera quelle per cui la otifica ancora NON è stata estesa alle Basi
 * vicine.
 * Poi ritorna un Array di missioni per cui il timeout è stato superato.
 * @param {Object} timeout
 * @returns {Array}
 */
const exceededTimeoutCheck = async (timeout) => {
    const missions = await Mission.find({ 'notifiedBases': { $exists: true, $not: {$size: 0} }, 'status.waitingForTeam.value': true, 'status.teamCreated.value': false }, '')
    let ret = []
    const now = new Date().getTime()
    for (const mission of missions) {
        // Se la missione ha data di inizio entro 12h uso il timeout breve
        if (mission.date.getTime() - mission.status.requested.timestamp.getTime() < 12*60*60*1000) {
            if (now - mission.status.waitingForTeam.timestamp >= timeout.breve) {
                ret.push(mission)
            } 
        } else {
            if (now - mission.status.waitingForTeam.timestamp >= timeout.lungo) {
                ret.push(mission)
            }
        }
    }
    return ret
}

/**
 * Funzione che notifica il personale, mediante un messaggio Telegram.
 * @param {String}   idTelegram
 * @param {Mission}  mission
 * @param {Array}    bases
 */
const sendMessage = (idTelegram, mission, bases) => {
    const message = `Non riesco a trovare abbstanza personale per la missione del ${utils.format(mission.date, 'DD MMM YYYY hh:mm')}.\n` + 
    `Vuoi contattare le seguenti Basi o Abortire la missione?\n` +
    `Premi sulle basi che vuoi conattare.`

    let buttons = []
    for (const base of bases) {
        const buttonText = base.name
        const buttonData = `${zip['extendToBase']}:${base._id}:${mission._id}`
        
        buttons.push(Telegraf.Markup.callbackButton(buttonText, buttonData))
    }
    
    await this.bot.sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup(m => m.inlineKeyboard(buttons)                
    ))
    
}

/**
 * Funzione che notifica il BS su quali missioni hanno sforato il timeout per notificare le basi vicine.
 * Vengono mandati al BS dei bottoni per poter aggiungere le basi oppure abortire la missione
 * @param {Array} missions 
 */
const notifyBaseSupervisor = async (missions) => {
    if (missions.length === 0) { return }

    for (const mission of missions) {
        const supervisor    = await Personnel.findById(mission.supervisor, '')
        const bases         = await Base.find({ _id: { $ne: mission.base } }, '')
        sendMessage(supervisor.telegramData.idTelegram, mission, bases)
    }

}

const periodicTask = async (bot, deadline) => {
    this.bot = bot
    //this.deadline = deadline
    const period = 60000 // 60000ms -> 1min
    // per ogni missione trovo la base più vicina e notifico i piloti di quella base
    timers.setInterval(async () => {
        const { extend }    = JSON.parse(fs.readFileSync('file', 'utf8'))
        const missions      = await exceededTimeoutCheck(extend)


        //let missions = await missedDeadlines()
        /*
        for (let m of missions) {
            let nearestBase = await findNearestBase(m.base)
            notifyBase(nearestBase, m)
        }
        */
    }, period)
}

module.exports = periodicTask