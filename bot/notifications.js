const eventEmitters = require('../event-emitters')
const queries       = require('../db/queries')

const findAnNotify = aMission => {
    var alreadyNotified = [aMission.supervisor]
    queries.Personnel.find({
            _id: {$nin: alreadyNotified},
            base: aMission.base,
            'roles.occupation.pilot': true,
            'pilot.license.maxMissionRank': {$gte: aMission.rank}, 
            'pilot.droneTypes': {$all: [aMission.drones[0].type]}
        }, {}, pilots =>{
        // TODO: recuperare anche le ore di volo dei piloti

        // Notifico i piloti
        pilots.forEach(pilot => {
            this.bot.sendMessage(pilot.telegramData.idTelegram, 'Notifica di missione come pilota, /accept o /decline ?')
            alreadyNotified.push(pilot._id)
        })

        queries.Personnel.find({
                base: aMission.base,
                'roles.occupation.crew': true,
                _id: {$nin: this.alreadyNotified}
            }, {}, crew => {
            // Notifico la crew
            crew.forEach(crewMember => {
                this.bot.sendMessage(crewMember.telegramData.idTelegram, 'Notifica di missione come membro dell\'equipaggio, /accept o /decline ?')
                alreadyNotified.push(crewMember._id)
            })

            // Se la missione dura più di 3h cerco anche i maintainers
            if (aMission.descrtiption.duration.expected >= 3)
                queries.Personnel.find({
                    _id: {$nin: this.alreadyNotified},
                    base: aMission.base,
                    'roles.occupation.crew': true,
                }, {}, maintainers => 
                    maintainers.forEach(maintainer => this.bot.sendMessage(maintainer.telegramData.idTelegram, 'Notifica di missione come manutentore, /accept o /decline ?')))
            
            //alreadyNotified = []
        })

    })
}

const eventHandlers = {
    Mission: {
        insert: () => eventEmitters.Mission.on('insert', aMission => findAnNotify(aMission))
    }
}



const notification = bot => {
    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    this.bot = bot

    eventHandlers.Mission.insert()
}


module.exports = notification