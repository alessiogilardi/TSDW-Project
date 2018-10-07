const queries = require('../../db/queries')

// TODO: al personale viene mandato un pulsante con cui possono accettare o rifiutare
// nella callBack del pulsante forse è possibile inserire anche l'id della missione che viene accettata
// nel caso serva per fare dei controlli

// TODO: recuperare anche le ore di volo dei piloti

const sendNotifications = () => this.toNotify.forEach(person => {
    switch(person.role){
        case 'pilot':
            // Mando notifica da pilota
            this.bot.telegram.sendMessage(person.idTelegram, 'Richiesta di missione come pilota, /accept o /decline?')
            break;
        case 'crew':
            // Mando la notifica da crew
            this.bot.telegram.sendMessage(person.idTelegram, 'Richiesta di missione come crew, /accept o /decline?')
            break;
        case 'maintainer':
            // Mando la notifica da manutentore
            this.bot.telegram.sendMessage(person.idTelegram, 'Richiesta di missione come manutentore, /accept o /decline?')
            break;
    }
})

const find = {
    pilots: {
        query: () => {
            return {
                _id: {$neq: this.mission.supervisor},
                base: this.mission.base,
                'roles.occupation.pilot': true,
                'missions.available': true,
                'pilot.license.maxMissionRank': {$gte: this.mission.rank}, 
                'pilot.droneTypes': {$all: [this.mission.drones[0].type]}
            }
        },
        projection: '_id telegramData.idTelegram',
        exec: () => {
            return new Promise((resolve, reject) => {
                queries.Personnel.find(find.pilots.query(), find.pilots.projection, pilots => {
                    if (pilots !== undefined || pilots.length !== 0) {
                        pilots.forEach(pilot => this.toNotify.push({id: pilot._id, idTelegram: pilot.telegramData.idTelegram, role: 'pilot'}))
                        resolve()
                    }
                    else
                        reject('Nessun pilota trovato')
                })
            })
        }
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
        projection: '_id telegramData.idTelegram',
        exec: () => {
            return new Promise((resolve, reject) => {
                queries.Personnel.find(find.crew.query(), find.crew.projection, crew => {
                    if (crew !== undefined || crew.length !== 0) {
                        crew.forEach(crewMember => this.toNotify.push({id: crewMember._id, idTelegram: crewMember.telegramData.idTelegram, role: 'crew'}))
                        resolve()
                    }
                    else
                        reject('Nessun membro dell\'equipaggio trovato')
                })
            })
        }

    },
    maintainers: {
        query: () => {
            return {
                _id: {$nin: Array.from(this.toNotify, person => person._id).push(this.mission.supervisor)},
                base: aMission.base,
                'roles.occupation.maintainer': true,
                'missions.available': true,
            }
        },
        projection: '_id telegramData.idTelegram',
        exec: () => {
            return new Promise((resolve, reject) => {
                queries.Personnel.find(find.maintainers.query(), find.maintainers.projection, maintainers => {
                    if (maintainers !== undefined || maintainers.length !== 0) {
                        maintainers.forEach(maintainer => this.toNotify.push({id: maintainer._id, idTelegram: maintainer.telegramData.idTelegram, role: 'pilot'}))
                        resolve()
                    }
                    else
                        reject('Nessun manutentore trovato')
                })
            })
        }
    }
}

const onCreateMission = (bot, mission) => {
// Funzione che si occupa di richiamare altre funzioni per la notifica del personale
// Vengono anche registrati icomandi accept e decline sul bot

// DEBUG:
console.log('onCreateMission')

    if (bot === null || bot === undefined) throw new Error('Missing Telegram Bot')
    if (mission === null || mission === undefined) throw new Error('Missing a valid Mission')

    this.bot = bot
    this.mission = mission
    this.toNotify = []

    find.pilots().exec()
    .then(() => {
        // Aggiungo la crew a toNotify
        find.crew.exec()
        .then(() => {
            // Aggiungo i manutentori a toNotify
            find.maintainers.exec()
            .then(() => sendNotifications())
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))

    /* TODO: Da provare successivamente:
    // Cerco i piloti
    find.pilots().exec()
    .then(() => {
        // Cerco la crew
        return find.crew.exec()
    })
    .then(() => {
        // Cerco i manutentori
        return find.maintainers.exec()
    })
    // Mando la notifica
    .then(() => sendNotifications())
    .catch(err => console.log(err))
    */

}

module.exports = onCreateMission