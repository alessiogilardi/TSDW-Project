const { Mission, Drone, Qtb } = require('../../db/queries')
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')

/**
 * Scene che gestisce l'inserimento del Qtb e delle relative informazioni per le Missioni in cui manca
 */

const addQtb = new WizardScene('addQtb', 
    async ctx => {
        // 

        const person                = ctx.session.userData.person //await Personnel.findByIdTelegram(ctx.message.chat.id)

        // Cerco i droni che hanno il campo waitingForQtb non vuoto
        ctx.scene.state.wfqtbDrones = await Drone.find({'missions.waitingForQtb': {$exists: true, $not: {$size: 0}}})
        // Per ognuno di questi droni, itero sulle missioni delle quali va inserito il qtb
        for (let drone of ctx.scene.state.wfqtbDrones) {
            // Controllo che la base a cui è assegnato il drone sia uguale a quella del supervisore: se non è così, ignoro questo drone
            if (person.base != drone.base)
                continue
            await ctx.reply(`Per il drone targato ${drone.number} manca il qtb per le seguenti missioni:`)
            for (let mission of drone.missions.waitingForQtb) {
                // Invio un Button per ogni missione
                const message       = `Missione del ${mission.date}`
                const buttonText    = 'Aggiungi Qtb'
                const buttonData    = `${'addQtb'}:${drone._id}:${mission._id}:${mission.date}`
                await ctx.reply(message, Telegraf.Extra
                    .markdown()
                    .markup(m => m.inlineKeyboard([
                        m.callbackButton(buttonText, buttonData)
                    ])
                ))
            }
        }

        return ctx.wizard.next()
    },
    new Composer((ctx, next) => {
        return next()
    })
    .on('callback_query', async ctx => {
        const parts = ctx.callbackQuery.data.split(':')
        if (parts[0] !== 'addQtb') { return }

        ctx.scene.state.currentDrone   = parts[1] 
        ctx.scene.state.currentMission = parts[2]
        ctx.scene.state.curMissionDate = parts[3]
        await ctx.editMessageReplyMarkup({})
        await ctx.reply('Inserisci il numero di protocollo del Qtb:')

        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        ctx.scene.state.protocolNumber = ctx.message.text
        await ctx.reply('Inserisci gli istanti di inizio e fine di ogni volo\n'+
                        'Esempio: 12.00-14.00,16.00-18.00 per indicare due voli dalle 12 alle 14 e dalle 16 alle 18')

        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        // Parsing dei voli: i voli sono separati da ','
        let flights = ctx.message.text.split(',')
        // Per ogni volo individuo gli istanti di inizio e fine
        let instants = []
        for (let flight of flights) {
            // Trovo l'inizio e la fine, che sono separati da '-'
            let start = flight.split('-')[0]
            let end   = flight.split('-')[1]
            // Aggiorno start ed end assegnando loro un oggetto Date. Questo è creato a partire dalla data della missione a cui vengono
            // aggiunti ore (per esempio start.split('.')[0]) e minuti (start.split('.')[1]) trovati sopra
            start = ctx.scene.state.currMissionDate.setHours(start.split('.')[0], start.split('.')[1])
            end   = ctx.scene.state.currMissionDate.setHours(end.split('.')[0], end.split('.')[1])
            instants.push({'flightStart': start, 'flightEnd': end})
        }

        /**
         * 1. Inserisco il qtb nel database
         * 2. Aggiorno lo stato della missione per quel drone, che passa da waitingForQtb a completed
         * 3. Inserisco il qtb appena inserito nell'array qtbs della relativa missione
         */
    })
).leave(ctx => {

})

module.exports = addLogbook