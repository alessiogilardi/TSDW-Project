/**
 * Modulo che contiente gli eventi e le procedure scatenate nel momento in cui
 * una missione è inserita nel database.
 * 
 * Vengono cercati i vari membri del personale, in base ai parametri della missione e vengono poi notificati,
 * vengono loro mandati dei Button con cui possono accettare o declinare.
 */

const queries = require('../../db/queries')
const Telegraf = require('telegraf')

// TODO: recuperare anche le ore di volo dei piloti

/**
 * Funzione che notifica il personale, mediante un messaggio Telegram e attraverso un messaggio.
 * @param {*} idTelegram 
 * @param {*} message 
 * @param {*} role 
 */
const notify = (idTelegram, message, role) => {
    this.bot.telegram.sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup( m => m.inlineKeyboard([
            m.callbackButton('Accetta', JSON.stringify({action: 'acceptMission', cbMessage: 'Missione accettata', data: {mission: {_id: this.mission._id, date: this.mission.date}, role: role}})),
            m.callbackButton('Rifiuta', JSON.stringify({action: 'declineMission'}))
    ])))
}

/**
 * Funzione che notifica il personale.
 * 
 * @param {*} persons 
 * @param {*} mission 
 */
const sendNotifications = (persons, mission) => {
    for (let person of persons) {
        let roles = [person.roles.occupation.pilot, person.roles.occupation.crew, person.roles.occupation.maintainer]
        console.log(`Notifing: ${person} as ${roles}`)
        notify(person.telegramData.idTelegram, `Richiesta di missione come ${roles}:\n${mission}`)
        // aggiornare tramite query specifiche il database
    }

    /*
    for (let person of persons) {
        console.log(`Notifing: ${person} as ${person.role}`)
        switch(person.role){
            case 'pilot':
                // Mando notifica da pilota e lo setto come notificato nella Missione
                notify(person.idTelegram, `Richiesta di missione come *pilota*:\n${mission}`, person.role)
                queries.Mission.Pilot.setAsNotified(mission._id, person._id)
                break;
            case 'crew':
                // Mando la notifica da crew e lo setto come notificato nella Missione
                notify(person.idTelegram, `Richiesta di missione come *membro dell'equipaggio*:\n${mission}`, person.role)
                queries.Mission.Pilot.setAsNotified(mission._id, person._id)
                break;
            case 'maintainer':
                // Mando la notifica da manutentore e lo setto come notificato nella Missione
                notify(person.idTelegram, `Richiesta di missione come *manutentore*:\n${mission}`, person.role)
                queries.Mission.Pilot.setAsNotified(mission._id, person._id)
                break;
        }
    }*/
}

// Le query ritornano membri del personale (piloti, crew, manutentori) che
// appartengono alla base in questione, hanno effetivamente quel quolo nella base, e non hanno acettato missioni
// nello stesso giorno della missione che si sta creando.
// In più per i piloti: vengono notificati solo colore che rispettano i paramtri della missione
/*const find = {
    pilots: {
        query: () => {
            return {
                base: this.mission.base,
                'roles.occupation.pilot': true,
                'pilot.license.maxMissionRank': {$gte: this.mission.description.rank}, 
                'pilot.droneTypes': {$all: [this.mission.drones[0].type]},
                'missions.pilot.accepted.date': {$ne: this.ctx.session.command.params.date}
            }
        },
        projection: '_id telegramData.idTelegram'
    },
    crew: {
        query: () => {
            return {
                base: this.mission.base,
                'roles.occupation.crew': true,
                _id: {$nin: Array.from(this.toNotify, person => person._id)},
                'missions.crew.accepted.date': {$ne: this.ctx.session.command.params.date}
            }
        },
        projection: '_id telegramData.idTelegram'
    },
    maintainers: {
        query: () => {
            return {
                _id: {$nin: Array.from(this.toNotify, person => person._id)},
                base: this.mission.base,
                'roles.occupation.maintainer': true,
                'missions.maintainer.accepted.date': {$ne: this.ctx.session.command.params.date}
            }
        },
        projection: '_id telegramData.idTelegram'
    }
}*/

/**
 * Funzione che si occupa di chiamare altre funzioni per la notifica del personale. 
 * Vengono anche registrati i comandi `accept` e `decline` sul bot.
 * @param {*} bot 
 * @param {*} mission 
 */

const onOrganizedMission = (bot, mission) => {
    // TODO: la missione deve essere aggiunta alle organized missions del baseSup

    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    if (mission === null || mission === undefined) throw new Error('Missing a valid Mission')

    /* ---OLD---
    this.bot = bot
    this.ctx = this.bot.ctx
    this.mission = mission
    this.toNotify = []

    queries.Personnel.find(find.pilots.query(), find.pilots.projection, pilots => {
        if (pilots !== undefined) {
            pilots.forEach(pilot => this.toNotify.push({_id: pilot._id, idTelegram: pilot.telegramData.idTelegram, role: 'Pilot'}))            

        }
        queries.Personnel.find(find.crew.query(), find.crew.projection, crew => {
            if (crew !== undefined)
                crew.forEach(crewMember => this.toNotify.push({_id: crewMember._id, idTelegram: crewMember.telegramData.idTelegram, role: 'Crew'}))
            
            // Se la missione dura più di 3h notifico anche i manutentori
            if (this.mission.description.duration.expected >= 3){
                queries.Personnel.find(find.maintainers.query(), find.maintainers.projection, maintainers => {
                    if (maintainers !== undefined)
                        maintainers.forEach(maintainer => this.toNotify.push({_id: maintainer._id, idTelegram: maintainer.telegramData.idTelegram, role: 'Maintainer'}))
                    sendNotifications()
                })
            } else {
                sendNotifications()
            }
        })
    })
    */

    let selection = {}

    // Vengono cercati tutti i membri del personale che ricoprono almeno uno dei ruoli pilota, crew, manutentore
    selection = {
        base: mission.base,
        $or: [{'roles.occupation.pilot': true}, {'roles.occupation.crew': true,}, {'roles.occupation.maintainer': true}],
        'missions.accepted.date': {$ne: mission.date}
    }
    let queryResult = await queries.Personnel.find(selection, '') // tutto il personale che può svolgere la missione

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

    /*// NOTIFICA CREW
    selection = {
        base: mission.base,
        'roles.occupation.crew': true,
        'missions.crew.accepted.date': {$ne: mission.date}
    }
    let crew = await queries.Personnel.find(selection, '')
    sendNotifications(crew, mission)

    // NOTIFICA MANUTENTORI
    selection = {
        base: mission.base,
        'roles.occupation.maintainer': true,
        'missions.maintainer.accepted.date': {$ne: mission.date}
    }
    let maintainers = await queries.Personnel.find(selection, '')
    sendNotifications(maintainers, mission)*/
}

module.exports = onOrganizedMission
