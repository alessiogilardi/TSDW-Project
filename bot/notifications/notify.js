const eventEmitters = require('../../event-emitters')
const onCreateMission = require('./on-create-mission')

/*
const findAnNotify = aMission => {
    var alreadyNotified = [aMission.supervisor]
    queries.Personnel.find({
            _id: {$nin: alreadyNotified},
            base: aMission.base,
            'roles.occupation.pilot': true,
            'missions.available': true,
            'pilot.license.maxMissionRank': {$gte: aMission.rank}, 
            'pilot.droneTypes': {$all: [aMission.drones[0].type]}
        }, {}, pilots =>{
        // TODO: recuperare anche le ore di volo dei piloti

        // Notifico i piloti
        pilots.forEach(pilot => {
            this.bot.telegram.sendMessage(pilot.telegramData.idTelegram, 'Notifica di missione come pilota, /accept o /decline ?')
            alreadyNotified.push(pilot._id)
        })

        queries.Personnel.find({
                base: aMission.base,
                'roles.occupation.crew': true,
                'missions.available': true,
                _id: {$nin: this.alreadyNotified}
            }, {}, crew => {
            // Notifico la crew
            crew.forEach(crewMember => {
                this.bot.telegram.sendMessage(crewMember.telegramData.idTelegram, 'Notifica di missione come membro dell\'equipaggio, /accept o /decline ?')
                alreadyNotified.push(crewMember._id)
            })

            // Se la missione dura più di 3h cerco anche i maintainers
            if (aMission.description.duration.expected >= 3)
                queries.Personnel.find({
                    _id: {$nin: this.alreadyNotified},
                    base: aMission.base,
                    'roles.occupation.maintainer': true,
                    'missions.available': true,
                }, {}, maintainers => 
                    maintainers.forEach(maintainer => this.bot.telegram.sendMessage(maintainer.telegramData.idTelegram, 'Notifica di missione come manutentore, /accept o /decline ?')))
            
            //alreadyNotified = []
        })

    })
}
*/
const eventHandlers = {
    Db: {
        Mission:  {
            insert: () => eventEmitters.Db.Mission.on('insert', aMission => onCreateMission(this.bot, aMission))
        }
    },
    Bot: {
        requestMission: () => eventEmitters.Bot.on('requestMission', (aPerson, message) => {
            this.bot.telegram.sendMessage(aPerson.telegramData.idTelegram, message)
        })
    }
}



const notify = bot => {
    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    this.bot = bot

    eventHandlers.Db.Mission.insert()
    eventHandlers.Bot.requestMission()
}


module.exports = notify