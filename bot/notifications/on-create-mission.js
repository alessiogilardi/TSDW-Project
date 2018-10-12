const queries = require('../../db/queries')
const Telegraf = require('telegraf')

// TODO: il personale un volta notificato deve essere inserito nei notificati della missione

// TODO: al personale viene mandato un pulsante con cui possono accettare o rifiutare
// nella callBack del pulsante forse è possibile inserire anche l'id della missione che viene accettata
// nel caso serva per fare dei controlli

// TODO: recuperare anche le ore di volo dei piloti

const sendNotifications = () => this.toNotify.forEach(person => {
    console.log(`Notifing: ${person}`)
    switch(person.role){
        case 'pilot':
            // Mando notifica da pilota
            this.bot.telegram.sendMessage(person.idTelegram, `Richiesta di missione come *pilota*:\n${this.mission}`, Telegraf.Extra
            .markdown()
            .markup( m => m.inlineKeyboard([
                m.callbackButton('Accetta', 'accept'),
                m.callbackButton('Rifiuta', 'decline')
            ])))
            .then(queries.Mission.Pilot.setAsNotified(this.mission._id, person._id))
            .catch(err => console.log(err))
            break;
        case 'crew':
            // Mando la notifica da crew
            this.bot.telegram.sendMessage(person.idTelegram, `Richiesta di missione come *membro dell'equipaggio*:\n${this.mission}`, Telegraf.Extra
            .markdown()
            .markup( m => m.inlineKeyboard([
                m.callbackButton('Accetta', 'accept'),
                m.callbackButton('Rifiuta', 'decline')
            ])))
            break;
        case 'maintainer':
            // Mando la notifica da manutentore
            this.bot.telegram.sendMessage(person.idTelegram, `Richiesta di missione come *manutentore*:\n${this.mission}`, Telegraf.Extra
            .markdown()
            .markup( m => m.inlineKeyboard([
                m.callbackButton('Accetta', 'accept'),
                m.callbackButton('Rifiuta', 'decline')
            ])))
            break;
    }
})

const find = {
    pilots: {
        query: () => {
            return {
                _id: {$ne: this.mission.supervisor},
                base: this.mission.base,
                'roles.occupation.pilot': true,
                'missions.available': true,
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
                'missions.available': true,
                _id: {$nin: Array.from(this.toNotify, person => person._id).push(this.mission.supervisor)}
            }
        },
        projection: '_id telegramData.idTelegram'
    },
    maintainers: {
        query: () => {
            return {
                _id: {$nin: Array.from(this.toNotify, person => person._id).push(this.mission.supervisor)},
                base: this.mission.base,
                'roles.occupation.maintainer': true,
                'missions.available': true,
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

            queries.Personnel.find(find.maintainers.query(), find.maintainers.projection, maintainers => {
                if (maintainers !== undefined)
                    maintainers.forEach(maintainer => this.toNotify.push({_id: maintainer._id, idTelegram: maintainer.telegramData.idTelegram, role: 'maintainer'}))
                sendNotifications()
            })
        })
    })

}

module.exports = onCreateMission
