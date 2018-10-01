const eventEmitters = require('../event-emitters')
const queries = require('../db/queries')

exports.build = () => (telegramBot) => {
    eventEmitters.Mission.on('insert', aMission => {
        queries.Drone.findById(aMission.drones[0], 'type', aDrone => {
            var alreadyNotified = [aMission.supervisor]
            queries.Personnel.find({
                _id: {$nin: alreadyNotified},
                base: aMission.base,
                'roles.occupation.pilot': true,
                'pilot.license.maxMissionRank': {$gte: aMission.rank}, 
                'pilot.droneTypes': {$all: [aDrone.type]}}, 
                {}, 
                pilots => {
                    // TODO: recuperare anche le ore di volo dei piloti

                    // Notifico i piloti 
                    pilots.forEach(pilot => telegramBot.sendMessage(pilot.telegramData.idTelegram, 'Notifica di missione, /accept o /decline ?'))

                    pilots.forEach(pilot => alreadyNotified.push(pilot._id));

                    queries.Personnel.find({
                        base: aMission.base,
                        'roles.occupation.crew': true,
                        _id: {$nin: alreadyNotified}},
                        {},
                        crew => {
                            // Notifico la crew
                            crew.forEach(crewMember => telegramBot.sendMessage(crewMember.telegramData.idTelegram, 'Notifica di missione, /accept o /decline ?'))

                            if (aMission.duration.expected >= 3) { // Se la durata è maggiore di 3h
                                crew.forEach(crewMember => alreadyNotified.push(crewMember._id))

                                queries.Personnel.find({
                                    base: aMission.base,
                                    'roles.occupation.crew': true,
                                    _id: {$nin: pilotsIds.concat(crewIds)}},
                                    {},
                                    // Notifico i manutentori
                                    maintainers => maintainers.forEach(maintainer => telegramBot.sendMessage(maintainer.telegramData.idTelegram, 'Notifica di missione, /accept o /decline ?'))
                                )
                            }

                    })
            })
        })
    })
}
