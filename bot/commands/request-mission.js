require('dotenv').config()
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')
const schemas       = require('../../db/schemas')
const eventEmitters = require('../../events/event-emitters')
const utils         = require('../../utils')
//const Telegraf      = require('telegraf')

const Base    = queries.Base
const Mission = queries.Mission
//const Personnel = queries.Personnel
//const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
//const sendMessage = bot.telegram.sendMessage

/* Modello da seguire, non c'è bisogno di dichiararlo:
    const dataStructure = {
        name: 'requestMission',
        error: false,
        searching: false,
        params: {
            base: {
                name: undefined,
                supervisor: undefined
            },
            date: undefined,
            description: undefined
        }
    }
*/

/**
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
        ctx.session.command.name      = 'requestMission'
        ctx.session.command.searching = false
        ctx.session.command.error     = false
        ctx.reply('Bene, iniziamo la procedura per la richiesta di una missione!\nTi verrà chiesto di inserire alcuni parametri.')
        .then(() => ctx.reply('Ti ricordo che puoi annullare l\'operazione  in qualsiasi momento usando il comando /cancel.'))
        .then(() => ctx.reply('Inserisci la data della missione:'))
        .catch(err => console.log(err))
        ctx.wizard.next()
    },
    new Composer()
    .on('text', ctx => {            
        if (!utils.Date.isValid(ctx.message.text)) { // Verifico che la data inserita sia in un formato corretto
            ctx.reply('La data inserita non è valida, per favore reinseriscila')
            return
        }
        ctx.session.command.params.date = utils.Date.parse(ctx.message.text)
        ctx.reply('A quale base vuoi affidare la missione? Inserisci il nome della base:')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        if (ctx.session.command.searching)
            return
        ctx.session.command.searching = true
        /*
        Base.findByName(ctx.message.text, {})
        .then(aBase => {

        })
        */
        Base.findByName(ctx.message.text, {}, aBase => {
            ctx.session.command.searching = false
            if (aBase === null) {
                ctx.reply('Mi spiace, hai inserito una base non valida, per favore inseriscine un\'altra.')
                return
            }
            ctx.session.command.params.base.name = aBase.name;
            ctx.session.command.params.base.supervisor = aBase.roles.supervisor;

            ctx.reply('Inserisci le coordinate dove avrà luogo la missione.\nInserisci una posizione da GPS oppure scrivile in formato UTM (ZoneNumber ZoneLetter Easting Northing):')
            return ctx.wizard.next()
        })
    }),
    new Composer()
    .on('text', ctx => { // Leggo la location in coordinate UTM
        var coordinates = utils.stringToUTM(ctx.message.text) // Converto in coordinate UTM
        if (coordinates === null) {
            ctx.reply('Mi spiace, le coordinate che hai inserito non sono valide, reinseriscile.')
            return
        }
        coordinates = utm.convertUtmToLatLng(coordinates.easting, coordinates.northing, coordinates.zoneNum, coordinates.zoneLetter);
        ctx.session.command.params.location.latitude  = coordinates.lat
        ctx.session.command.params.location.longitude = coordinates.lng

        ctx.reply('Inserisci la durata prevista:')
        return ctx.wizard.next()

    })/*
    .on('location', ctx => { // Inserisco la location da GPS mediante modulo Telegram

    })*/,
    new Composer()
    .on('text', ctx => { // Leggo la durata prevista
        if (isNaN(ctx.message.text)) { // Verifico che il valore inserito sia un valore numerico
            ctx.reply('Mi spiace hai inserito un valore non valido, per favore inseriscine un altro.')
            return
        }
        ctx.command.params.description.duration.expected = ctx.message.text

        ctx.reply('Inserisci uno scenario valido:')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => { // Leggo lo scenario A,B,C
        if (!schemas.scenarios.includes(ctx.message.text)) {
            ctx.reply('Scenario non valido, inseriscine un altro.')
            return
        }
        ctx.session.command.params.description.riskEvaluation.scenario = ctx.message.text

        ctx.reply('Inserisci la difficoltà della missione (1 - 4):')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => { // Leggo il riskLevel della missione
        // Controllo che il valore inserito sia numerico e che sia un valore valido
        if (isNaN(ctx.message.text) || 
                ctx.message.text < schemas.riskLevel.min || 
                ctx.message.text > schemas.riskLevel.max) {
            ctx.reply('Ops, la difficoltà che hai inserito non è valida, inserisci un valore diverso.')
            return
        }
        ctx.session.command.params.description.riskEvaluation.level = ctx.message.text

        return ctx.scene.leave()
    })
).leave(ctx => {
    if (ctx.message.text === '/cancel') {
        ctx.reply('Richiesta missione annullata.')
        delete ctx.session.command
        return
    }

    ctx.reply('La missione è stata creata con successo!\nSarai notificato appena il Responsabile di Base l\'avrà presa in carico.')
    //.then(ctx.reply(`Ecco intanto un riepilogo sui dati della missione\n\nData: ${ctx.session.command.params.date}\nDurata prevista: ${ctx.session.command.params.expectedDuration}\nRango: ${ctx.session.command.params.rank}\nDroni scelti: ${ctx.session.command.params.drones.chosen.join(', ')}`))
    .then(() => ctx.reply('Ecco un riepilogo' + ctx.session.command.params))
    .catch(err => console.log(err))

    var aMission = ctx.session.command.params
    aMission.status.instantiated.value     = true
    aMission.status.instantiated.timestamp = new Date()

    ctx.session.command = undefined

    // TEST:
    return console.log(aMission)
    //

    // TODO: 
    // 1 - Inserire la Missione nel DB
    // 2 - Notificare il responsabile di base
    // 3 - Inserire l'evento nell'EventLog

    Mission.insert(aMission)
    .then(mission => {
        // Notifico il responsabile di base
        eventEmitters.Bot.emit('requestMission', mission)
    })
    .catch(err => console.log(err))
})
