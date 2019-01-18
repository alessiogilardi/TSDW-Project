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
        // TODO: devo scartare gli input non validi

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
        ctx.scene.state.flights = ctx.message.text.split(',')
        await ctx.reply('Inserisci l\'id del pilota per ogni volo, separati da virgole')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        // Parsing dei piloti per ogni volo
        let pilots = ctx.message.text.split(',')
        // Se il numero di piloti non coincide con il numero di voli: errore
        if (pilots.length !== ctx.scene.state.flights.length) {
            ctx.reply('Il numero di piloti non coincide con il numero di voli.\n'+
                      'Per favore reinserisci i piloti')
            return
        }
        // Inserisco i dati di ogni volo in un array di json, che viene poi inserito nel db
        let flightsData = []
        let flights = ctx.scene.state.flights
        for (let i = 0; i < flights.length; i++) {
            // Trovo l'inizio e la fine, che sono separati da '-'. Start: start_end[0]; end: start_end[1]
            let start_end = flights[i].split('-')
            // Inserisco i dati del volo come stringhe: inizio, fine e pilota
            flightsData.push({'flightStart': start_end[0], 'flightEnd': start_end[1], 'batteryCode': undefined, 'pilotId': pilots[i], 'notes': undefined})
        }

        /**
         * 1. Inserisco il qtb nel database
         * 2. Aggiorno lo stato della missione per quel drone, che passa da waitingForQtb a completed
         * 3. Inserisco il qtb appena inserito nell'array qtbs della relativa missione
         * (I punti 2 e 3 vengono fatti in automatico dalla qury di insert del Qtb)
         * 4. Aggiorno le ore di volo dei piloti sulla base delle durate dei voli contenute nell'array flightsData (da fare)
         */
        let qtb = {
            '_id': undefined,
            'date': ctx.scene.state.curMissionDate,
            'drone': ctx.scene.state.currentDrone,
            'mission': ctx.scene.state.currentMission,
            'flights': flightsData
        }
        await Qtb.insert(qtb)
        return ctx.scene.leave()
    })
).leave(ctx => {
    ctx.message.reply('Fine procedura inserimento qtb')
})

module.exports = addQtb