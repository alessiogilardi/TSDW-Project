require('dotenv').config()
const WizardScene   = require('telegraf/scenes/wizard/index')
const moment        = require('moment')
const Composer      = require('telegraf/composer')
const utmObj        = require('utm-latlng');
const queries       = require('../../db/queries')
const schemas       = require('../../db/schemas')
const ee            = require('../../events/event-emitters')
const utils         = require('../../utils')

const utm     = new utmObj()
const Base    = queries.Base
const Mission = queries.Mission

// TODO: gestire errori ed eccezioni, gestire in questi casi l'uscita dalla Scene

// Modello da seguire:
const command = {
    name: undefined,
    error: undefined,
    searching: undefined,
    mission: {
        date: undefined,
        base: {
            _id: undefined,
            name: undefined
        },
        supervisor: undefined, // _id del responsabile di base
        AM: undefined, // _id dell'AM che richiede la missione
        location: {
            latitude: undefined,
            longitude: undefined
        },
        status: {
            requested: {
                value: undefined,
                timestamp: undefined
            }
        },
        description: {
            duration: {
                expected: undefined,
            },
            riskEvaluation: {
                scenario: undefined,
                level: undefined
            }
        }
    }
}


/**
 * Funzione che richiede una nuova missione e fa partire l'iter corrispondente.
 * 
 * Si richiedono:
 *  - Data della missione
 *  - Base di partenza
 *  - Location di inizio della missione
 *  - Descrizione
 *      - Durata prevista -> usata per generare più missioni e aggiungere Manutentori
 *      - Valutazione di rischio
 * 
 * Azioni da eseguire in seguito:
 *  - Settare a true il campo Instantiated della missione
 *  - Aggiungere il timestamp a tale campo
 *  - Inserire l'evento nel eventsLog
 *  - Notificare il baseSup con i parametri della Missione
 */

const requestMission = new WizardScene('requestMission',
    ctx => {
        ctx.scene.state.command = command

        ctx.scene.state.command.name      = 'requestMission'
        ctx.scene.state.command.searching = false
        ctx.scene.state.command.error     = false

        ctx.scene.state.command.mission.AM = ctx.session.userData.person._id

        ctx.scene.state.riskMatrix = utils.loadRiskMatrix('./risk-matrix.txt')
        
        ctx.reply('Bene, iniziamo la procedura per la richiesta di una missione!\nTi verrà chiesto di inserire alcuni parametri.')
        .then(() => ctx.reply('Ti ricordo che puoi annullare l\'operazione  in qualsiasi momento usando il comando /cancel.'))
        .then(() => ctx.reply('Inserisci la data della missione:'))
        .catch(err => console.log(err))
        ctx.wizard.next()
    },
    new Composer()
    .on('text', ctx => {
        // Verifico che la data inserita sia in un formato corretto e che sia successiva ala data di oggi
        if (!utils.Date.isValid(ctx.message.text)) {
            ctx.reply('La data inserita non è valida, per favore reinseriscila')
            return
        }
        ctx.scene.state.command.mission.date = utils.Date.parse(ctx.message.text)
        ctx.reply('A quale base vuoi affidare la missione? Inserisci il nome della base:')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        if (ctx.scene.state.command.searching)
            return
        ctx.scene.state.command.searching = true
        
        Base.findByName(ctx.message.text, {})
        .then(aBase => {
            ctx.scene.state.command.searching = false
            //if (aBase === null) {
            if (!aBase) {
                ctx.reply('Mi spiace, hai inserito una base non valida, per favore inseriscine un\'altra.')
                return
            }
            ctx.scene.state.command.mission.base._id   = aBase._id
            ctx.scene.state.command.mission.base.name  = aBase.name
            ctx.scene.state.command.mission.supervisor = aBase.roles.supervisor

            ctx.reply('Inserisci le coordinate dove avrà luogo la missione.\nInserisci una posizione da GPS oppure scrivile in formato UTM (es: 33 T 0298830 4646912):')
            return ctx.wizard.next()
        })
        .catch(err => console.log(err))
    }),
    new Composer()
    .on('text', ctx => { // Leggo la location in coordinate UTM
        var coordinates = utils.stringToUTM(ctx.message.text) // Converto in coordinate UTM
        if (coordinates === null) {
            ctx.reply('Mi spiace, le coordinate che hai inserito non sono valide, reinseriscile in formato UTM.')
            return
        }
        coordinates = utm.convertUtmToLatLng(coordinates.easting, coordinates.northing, coordinates.zoneNumber, coordinates.zoneLetter)
        ctx.scene.state.command.mission.location.latitude  = coordinates.lat
        ctx.scene.state.command.mission.location.longitude = coordinates.lng

        ctx.reply('Inserisci la durata prevista in ore:')
        return ctx.wizard.next()

    })
    .on('location', ctx => { // Inserisco la location da GPS mediante modulo Telegram
        ctx.scene.state.command.mission.location = ctx.message.location

        ctx.reply('Inserisci la durata prevista in ore:')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => { // Leggo la durata prevista
        if (isNaN(ctx.message.text) || ctx.message.text <= 0) { // Verifico che il valore inserito sia un valore numerico e maggiore di 0
            ctx.reply('Mi spiace hai inserito un valore non valido, per favore inseriscine un altro.')
            return
        }
        ctx.scene.state.command.mission.description.duration.expected = ctx.message.text

        ctx.reply('Inserisci uno scenario valido:')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => { // Leggo lo scenario A,B,C
        if (!(ctx.message.text.toUpperCase() in ctx.scene.state.riskMatrix)) {
            ctx.reply('Scenario non valido, inseriscine un altro.')
            return
        }
        ctx.scene.state.command.mission.description.riskEvaluation.scenario = ctx.message.text.toUpperCase()

        ctx.reply('Inserisci la difficoltà della missione:')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => { // Leggo il riskLevel della missione
        // Controllo che il valore inserito sia numerico e che sia un valore valido
        let scenario = ctx.scene.state.command.mission.description.riskEvaluation.scenario
        let diff = ctx.message.text
        if (diff < 1 || diff > ctx.scene.state.riskMatrix[scenario].length) {
            ctx.reply('Ops, la difficoltà che hai inserito non è valida, inserisci un valore diverso.')
            return
        }
        ctx.scene.state.command.mission.description.riskEvaluation.level = ctx.message.text

        return ctx.scene.leave()
    })
).leave(ctx => {
    if (ctx.message.text === '/cancel') {
        ctx.reply('Richiesta missione annullata.')
        delete ctx.scene.state.command
        return
    }
    var mission  = ctx.scene.state.command.mission
    var baseName = mission.base.name
    let date     = new Date(mission.date)
    delete ctx.scene.state.command

    ;(async () => {
        await ctx.reply('La missione è stata creata con successo!\nSarai notificato appena il Responsabile di Base l\'avrà presa in carico.')
        await ctx.reply(`Ecco intanto un riepilogo sui dati della missione:\n\n` +
            `Data: ${utils.Date.format(date, 'DD MMM YYYY')}\n` +
            `Base: ${baseName}\nDurata prevista: ${mission.description.duration.expected} ore\n` +
            `Scenario: ${mission.description.riskEvaluation.scenario}\n` +
            `Difficoltà: ${mission.description.riskEvaluation.level}\n`)
        await ctx.replyWithLocation(mission.location.latitude, mission.location.longitude)
    })().catch(err => console.log(err))

    mission.base                       = mission.base._id
    mission.status.requested.value     = true
    mission.status.requested.timestamp = new Date()

    // 1 - Inserire la Missione nel DB
    // 2 - Notificare il responsabile di base
    // 3 - Inserire l'evento nell'EventLog
    let days = Math.ceil(mission.description.duration.expected/24)
    let startDate = mission.date
    let missions = []
    ;(async () => {
        for (let i = 0; i < days; i++) {        
            mission.date = new Date(moment(startDate).add(i,'d'))
            missions[i] = utils.copyObject(await Mission.insert(mission))
        }
        ee.bot.emit('missionRequested', missions)
    })()
    
})

module.exports = requestMission
