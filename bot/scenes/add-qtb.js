const { Mission, Drone, Qtb, Personnel } = require('../../db/queries')
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
        // Controllo che i valori delle date siano corretti
        for (let date of ctx.scene.state.flights) {
            date = date.split('.') // divido ore e minuti
            // Se le ore sono fuori dall'intervallo [0;24) c'è un errore
            // Se i minuti sono fuori dall'intervallo [0;60) c'è un errore
            if ((date[0] < 0 || date[0] >= 24) || (date[1] < 0 || date[1] >= 60)) {
                ctx.reply('Una o più date sono sbagliate\nPer favore, reinseriscile')
                return
            }
        }
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
        for (let i = 0; i < flights.length; i++) { // itero contemporaneamente sui voli e sui piloti
            // Trovo l'inizio e la fine, che sono separati da '-'. start: start_end[0]; end: start_end[1]
            let start_end = flights[i].split('-')
            let start = start_end[0]
            let end   = start_end[1]
            // Inserisco i dati del volo come stringhe: inizio, fine e pilota
            flightsData.push({'flightStart': start, 'flightEnd': end, 'batteryCode': undefined, 'pilotId': pilots[i], 'notes': undefined})
            // Calcolo la durata effettiva del volo
            // Divido da start ed end le ore e i minuti (divisi dal carattere '.')
            start = start.split('.') // ore: start[0]; minuti: start[1]
            end   = end.split('.')   // ore:   end[0]; minuti:   end[1]
            // Ci sono 4 situazioni possibili: end ha ore e minuti maggiori di ore e minuti di start, end ha i minuti minori,
            // end ha le ore minori, end ha ore e minuti minori
            // Esempi:
            // 16:00 - 18:20         => semplice: faccio la differenza tra le ore e tra i minuti (2:20)
            // 16:50 - 17:20         => trasformo 17:20 in 16:80 (tolgo 1h e aggiungo 60 minuti)
            // 23:50 - 01:55         => trasformo 01:55 in 25:55 (aggiungo 24h)
            // 23:50 - 01:30         => trasformo 01:30 in 24:90 (aggiungo 24h, quindi tolgo 1h e aggiungo 60 minuti) (combinazione dei due casi sopra)
            // Quindi, se le ore di end sono minori, aggiungo 24h
            if (end[0] < start[0])
                end[0] += 24
            // Se i minuti di end sono minori, tolgo 1h e aggiungo 60 minuti
            if (end[1] < start[1]) {
                end[0]--
                end[1] += 60
            }
            // Calcolo la differenza e la inserisco in flightsTime
            let diff = [0, 0]
            diff[0] = end[0] - start[0] // differenza delle ore
            diff[1] = end[1] - start[1] // differenza dei minuti
            // Trasformo ore e minuti (base 60) in un valore decimale (base 10) di ore di volo totali
            let flightTime = diff[0] + diff[1] / 60
            // Aggiorno ore di volo del pilota attuale
            Personnel.updateById(pilots[i], {$inc: {'pilot.flightTime': flightTime}}) // $inc incrementa il valore attuale del campo della quantità flightTime. Se il campo non eiste, lo crea e assegna quel valore
        }

        /**
         * 1. Inserisco il qtb nel database
         * 2. Aggiorno lo stato della missione per quel drone, che passa da waitingForQtb a completed
         * 3. Inserisco il qtb appena inserito nell'array qtbs della relativa missione
         * (I punti 2 e 3 vengono fatti in automatico dalla qury di insert del Qtb)
         */
        let qtb = {
            '_id': undefined,
            'date': ctx.scene.state.curMissionDate,
            'drone': ctx.scene.state.currentDrone,
            'mission': ctx.scene.state.currentMission,
            'flights': flightsData
        }
        let newQtb = await Qtb.insert(qtb)

        let mEvent = { type: 'addQtb', actor: ctx.session.userData.person._id, subject: {type: 'Qtb', _id: newQtb._id}, timestamp: new Date() }
		EventLog.insert(mEvent)

        return ctx.scene.leave()
    })
).leave(ctx => {
    ctx.message.reply('Fine procedura inserimento qtb')
})

module.exports = addQtb