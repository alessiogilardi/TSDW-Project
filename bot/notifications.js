const eventEmitters = require('../event-emitters')
const queries       = require('../db/queries')

const findAnNotify = aMission => {
    var alreadyNotified = [aMission.supervisor]
    queries.Personnel.find(eventHandlers.Mission.queries.pilots, {}, pilots =>{
        // TODO: recuperare anche le ore di volo dei piloti

        // Notifico i piloti
        pilots.forEach(pilot => {
            telegramBot.sendMessage(pilot.telegramData.idTelegram, 'Notifica di missione come pilota, /accept o /decline ?')
            alreadyNotified.push(pilot._id)
        })

        queries.Personnel.find(eventHandlers.Mission.queries.crew, {}, crew => {
            // Notifico la crew
            crew.forEach(crewMember => {
                telegramBot.sendMessage(crewMember.telegramData.idTelegram, 'Notifica di missione come membro dell\'equipaggio, /accept o /decline ?')
                alreadyNotified.push(crewMember._id)
            })

            // Se la missione dura più di 3h cerco anche i maintainers
            if (aMission.descrtiption.duration.expected >= 3)
                queries.Personnel.find(eventHandlers.Mission.queries.maintainers, {}, maintainers => 
                    maintainers.forEach(maintainer => telegramBot.sendMessage(maintainer.telegramData.idTelegram, 'Notifica di missione come manutentore, /accept o /decline ?')))
        })

    })
}

const eventHandlers = {
    Mission: {
        // TODO: escludere dalla ricerca i piloti occupati in missione
        queries: {
            pilots: {
                _id: {$nin: alreadyNotified},
                base: aMission.base,
                'roles.occupation.pilot': true,
                'pilot.license.maxMissionRank': {$gte: aMission.rank}, 
                'pilot.droneTypes': {$all: [aMission.drones[0].type]}
            },
            crew: {
                base: aMission.base,
                'roles.occupation.crew': true,
                _id: {$nin: alreadyNotified}
            },
            maintainers: {
                _id: {$nin: alreadyNotified},
                base: aMission.base,
                'roles.occupation.crew': true,
            }

        },
        insert: () => eventEmitters.Mission.on('insert', aMission => findAnNotify(aMission))
    }
}



const notification = telegramBot => {
    this.telegramBot = telegramBot
    eventHandlers.Mission.insert()
}


module.exports = notification