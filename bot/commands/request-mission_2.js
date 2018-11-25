require('dotenv').config()
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')
const eventEmitters = require('../../events/event-emitters')
const utils         = require('../../utils')
const Telegraf      = require('telegraf')

const Base = queries.Base
const Personnel = queries.Personnel
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
const sendMessage = bot.telegram.sendMessage

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
        // TODO: ...
    })
)
.leave(ctx => {
    if (ctx.message.text === '/cancel') {
        ctx.reply('Richiesta missione annullata.')
        delete ctx.session.command
        return
    }

    // TODO: ...
})
