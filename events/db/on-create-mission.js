/**
 * Modulo che contiente gli eventi e le procedure scatenate nel momento in cui
 * una missione è inserita nel database.
 * 
 * Vengono cercati i vari membri del personale, in base ai parametri della missione e vengono poi notificati,
 * vengono loro mandati dei Button con cui possono accettare o declinare.
 */

const queries = require('../db/queries')
const Telegraf = require('telegraf')

// TODO: recuperare anche le ore di volo dei piloti


const notify = (idTelegram, message, role) => {
    this.bot.telegram.sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup( m => m.inlineKeyboard([
            m.callbackButton('Accetta', JSON.stringify({action: 'acceptMission', cbMessage: 'Missione accettata', data: {mission: {_id: this.mission._id, date: this.mission.date}, role: role}})),
            m.callbackButton('Rifiuta', JSON.stringify({action: 'declineMission'}))
    ])))
}


const sendNotifications = () => this.toNotify.forEach(person => {
    console.log(`Notifing: ${person} as ${person.role}`)
    switch(person.role){
        case 'pilot':
            // Mando notifica da pilota e lo setto come notificato nella Missione
            notify(person.idTelegram, `Richiesta di missione come *pilota*:\n${this.mission}`, person.role)
            queries.Mission.Pilot.setAsNotified(this.mission._id, person._id)
            break;
        case 'crew':
            // Mando la notifica da crew e lo setto come notificato nella Missione
            notify(person.idTelegram, `Richiesta di missione come *membro dell'equipaggio*:\n${this.mission}`, person.role)
            queries.Mission.Pilot.setAsNotified(this.mission._id, person._id)
            break;
        case 'maintainer':
            // Mando la notifica da manutentore e lo setto come notificato nella Missione
            notify(person.idTelegram, `Richiesta di missione come *manutentore*:\n${this.mission}`, person.role)
            queries.Mission.Pilot.setAsNotified(this.mission._id, person._id)
            break;
    }
})

// Le query ritornano membri del personale (piloti, crew, manutentori) che
// appartengono alla base in questione, hanno effetivamente quel quolo nella base, e non hanno acettato missioni
// nello stesso giorno della missione che si sta creando.
// In più per i piloti: vengono notificati solo colore che rispettano i paramtri della missione
const find = {
    pilots: {
        query: () => {
            return {
                base: this.mission.base,
                'roles.occupation.pilot': true,
                'pilot.license.maxMissionRank': {$gte: this.mission.description.rank}, 
                'pilot.droneTypes': {$all: [this.mission.drones[0].type]},
                'missions.pilot.accepted.date': {$ne: ctx.session.command.params.date}
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
                'missions.crew.accepted.date': {$ne: ctx.session.command.params.date}
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
                'missions.maintainer.accepted.date': {$ne: ctx.session.command.params.date}
            }
        },
        projection: '_id telegramData.idTelegram'
    }
}


const onCreateMission = (bot, mission) => {
// Funzione che si occupa di richiamare altre funzioni per la notifica del personale
// Vengono anche registrati i comandi accept e decline sul bot

    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    if (mission === null || mission === undefined) throw new Error('Missing a valid Mission')

    this.bot = bot
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

}

module.exports = onCreateMission
