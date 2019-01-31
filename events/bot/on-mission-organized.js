/**
 *
 */

const queries   = require('../../db/queries')
const Telegraf  = require('telegraf')
const bf        = require('../../bot/bot-functions')
const zip       = bf.zip
const Personnel = queries.Personnel
const Mission   = queries.Mission

// TODO: recuperare anche le ore di volo dei piloti

/**
 * Funzione che notifica il personale, mediante un messaggio Telegram.
 * @param {String} idTelegram 
 * @param {String} message 
 * @param {Array}  roles Possibili ruoli che la persona può ricoprire nella missione
 */
const notify = (idTelegram, message, roles, missionId) => {
    for (let i in roles) {
        roles[i] = zip[roles[i]];
    }
    let buttonPayload = `${zip['acceptMission']}:${missionId}:${roles.join(',')}`
    console.log('Print buttonPayload: ')
    console.log(buttonPayload)
    console.log(Buffer.byteLength(buttonPayload, 'utf8') + " bytes")
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
// TODO: formatta output Missione
const sendNotifications = async (persons, mission) => {
    const r = ['pilot', 'crew', 'maintainer']
    for (let person of persons) {
        let roles = [person.roles.occupation.pilot, person.roles.occupation.crew, person.roles.occupation.maintainer]
        let tmp = []
        for (let i in roles) {
            if (roles[i]) { tmp.push(r[i]) }
        }
        roles = tmp
        console.log(`Notifing: ${person.name} ${person.surname} as ${roles}`)
        let message = `Richiesta di missione come ${roles.join(',')}:\n${mission}`
        notify(person.telegramData.idTelegram, message, roles, mission._id)
        Mission.updateById(mission._id, { $push: { 'personnel.notified': person._id } })
    }
}

/**
 * Funzione che si occupa di chiamare altre funzioni per la notifica del personale. 
 * Vengono anche registrati i comandi `accept` e `decline` sul bot.
 * @param {*} bot 
 * @param {*} mission 
 */
const onMissionOrganized = async (bot, mission) => {
    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    if (mission === null || mission === undefined) throw new Error('Missing a valid Mission')
    this.bot = bot

    // Vengono cercati tutti i membri del personale che ricoprono almeno uno dei ruoli pilota, crew, manutentore
    const selection = {
        base: mission.base,
        $or: [{ 'roles.occupation.pilot': true }, { 'roles.occupation.crew': true }, { 'roles.occupation.maintainer': true }],
        'missions.accepted.date': {$ne: mission.date}
    }
    const queryResult = await Personnel.find(selection, '') // tutto il personale che può svolgere la missione

    // Filtro il personale trovato per eliminare il ruolo di pilota a chi non soddisfa i requisiti sul tipo di drone pilotabile
    let personnel = []
    for (let person of queryResult) {
        // Se la persona è un pilota e non soddisfa i requisiti sul tipo di drone gli viene rimosso il ruolo di pilota per questa missione
        if (person.roles.occupation.pilot == true && !person.pilot.droneTypes.includes(mission.droneType))
            person.roles.occupation.pilot = false
        // Se la persona ha ancora almeno un ruolo, viene notificata
        if (person.roles.occupation.pilot || person.roles.occupation.crew || person.roles.occupation.maintainer)
            personnel.push(person)
    }
    sendNotifications(personnel, mission)

    // Aggiungo la missione a quelle organizzate dal BaseSup
    Personnel.updateById(mission.supervisor, { $push: { 'missions.supervisor.organized': mission._id } })

    // Inserisco l'evento nel Event Log
    let mEvent = { type: 'missionOrganized', actor: mission.supervisor, subject: {type: 'Mission', _id: mission._id}, timestamp: new Date() }
	EventLog.insert(mEvent)
}

module.exports = onMissionOrganized
