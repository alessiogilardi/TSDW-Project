const queries = require('../db/queries')
const Telegraf = require('telegraf')

// TODO: il personale un volta notificato deve essere inserito nei notificati della missione

// TODO: al personale viene mandato un pulsante con cui possono accettare o rifiutare
// nella callBack del pulsante forse è possibile inserire anche l'id della missione che viene accettata
// nel caso serva per fare dei controlli

// TODO: recuperare anche le ore di volo dei piloti

// TODO: i bottoni lanciano action con l'id della missione
// TODO: definire un action listener del bot in modo da rispondere ad una missione specifica

const notify = (idTelegram, message, role) => {
    this.bot.telegram.sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup( m => m.inlineKeyboard([
            m.callbackButton('Accetta', JSON.stringify({action: 'acceptMission', cbMessage: 'Missione accettata', data: {mission: {_id: this.mission._id}}, role: role})),
            m.callbackButton('Rifiuta', JSON.stringify({action: 'declineMission'}))
    ])))
}


const sendNotifications = () => this.toNotify.forEach(person => {
    console.log(`Notifing: ${person} as ${person.role}`)
    switch(person.role){
        case 'pilot':
            // Mando notifica da pilota
            notify(person.idTelegram, `Richiesta di missione come *pilota*:\n${this.mission}`, person.role)
            queries.Mission.Pilot.setAsNotified(this.mission._id, person._id)
            break;
        case 'crew':
            // Mando la notifica da crew
            notify(person.idTelegram, `Richiesta di missione come *membro dell'equipaggio*:\n${this.mission}`, person.role)
            queries.Mission.Pilot.setAsNotified(this.mission._id, person._id)
            break;
        case 'maintainer':
            // Mando la notifica da manutentore
            notify(person.idTelegram, `Richiesta di missione come *manutentore*:\n${this.mission}`, person.role)
            queries.Mission.Pilot.setAsNotified(this.mission._id, person._id)
            break;
    }
})

const find = {
    pilots: {
        query: () => {
            return {
                base: this.mission.base,
                'roles.occupation.pilot': true,
                'pilot.license.maxMissionRank': {$gte: this.mission.description.rank}, 
                'pilot.droneTypes': {$all: [this.mission.drones[0].type]}
            }
        },
        projection: '_id telegramData.idTelegram'
    },
    crew: {
        query: () => {
            return {
                base: this.mission.base,
                'roles.occupation.crew': true,
                _id: {$nin: Array.from(this.toNotify, person => person._id)}
            }
        },
        projection: '_id telegramData.idTelegram'
    },
    maintainers: {
        query: () => {
            return {
                _id: {$nin: Array.from(this.toNotify, person => person._id)},
                base: this.mission.base,
                'roles.occupation.maintainer': true
            }
        },
        projection: '_id telegramData.idTelegram'
    }
}


const onCreateMission = (bot, mission) => {
// Funzione che si occupa di richiamare altre funzioni per la notifica del personale
// Vengono anche registrati icomandi accept e decline sul bot

    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    if (mission === null || mission === undefined) throw new Error('Missing a valid Mission')

    this.bot = bot
    this.mission = mission
    this.toNotify = []
    this.counter = 0

    queries.Personnel.find(find.pilots.query(), find.pilots.projection, pilots => {
        if (pilots !== undefined) {
            pilots.forEach(pilot => this.toNotify.push({_id: pilot._id, idTelegram: pilot.telegramData.idTelegram, role: 'pilot'}))            

        }
        queries.Personnel.find(find.crew.query(), find.crew.projection, crew => {
            if (crew !== undefined)
                crew.forEach(crewMember => this.toNotify.push({_id: crewMember._id, idTelegram: crewMember.telegramData.idTelegram, role: 'crew'}))
            
            // Se la missione dura più di 3h notifico anche i manutentori
            if (this.mission.description.duration.expected >= 3){
                queries.Personnel.find(find.maintainers.query(), find.maintainers.projection, maintainers => {
                    if (maintainers !== undefined)
                        maintainers.forEach(maintainer => this.toNotify.push({_id: maintainer._id, idTelegram: maintainer.telegramData.idTelegram, role: 'maintainer'}))
                    sendNotifications()
                })
            } else {
                sendNotifications()
            }
        })
    })

}

module.exports = onCreateMission
