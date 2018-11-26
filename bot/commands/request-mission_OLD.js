/**
 * Modulo che gestisce la richista di una missione da parte di un AM nei confronti di un responsabile di base.
 * Utilizza una Scene implmentata attraverso vari step consecutivi.
 * Al completamento di tutti gli step la Scene viene lasciata e viene richiesta missione.
 * Viene lanciato un evento requestMission gestuto dal modulo onRequestMission
 * 
 * Se è lanciato il comando /cancel la procedura viene interrotta, i dati inseriti vengono scartati
 * e la Scene è lasciata senza apportare modifiche.
 */



const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')
const eventEmitters = require('../../events/event-emitters')
const utils         = require('../../utils')
// TODO: va formattato l'output quando mostro i droni disponibili (decidere cosa mostrare e come)
// TODO: la data va formattata in output
// TODO: non rinotificare chi ha richiesto la missione

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

const requestMission = new WizardScene('requestMission',
    ctx => {
        ctx.session.command = dataStructure
        ctx.reply('Bene, iniziamo la procedura per la richiesta di una missione!\nTi verrà chiesto di inserire alcuni parametri.')
        .then(() => ctx.reply('Ti ricordo che puoi annullare l\'operazione  in qualsiasi momento usando il comando /cancel.'))
        .then(() => ctx.reply('Inserisci la data della missione:'))
        .catch(err => console.log(err))
        ctx.wizard.next()
    },
    new Composer()
    .on('text', ctx => {
        // Parso la data inserita e la verifico                
        if (!utils.Date.isValid(ctx.message.text)) {
            ctx.reply('La data inserita non è valida, per favore reinseriscila')
            return
        }
        ctx.session.command.params.date = utils.Date.parse(ctx.message.text)
        ctx.reply('A quale base vuoi affidare la missione? Inserisci il nome della base:')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        // Cerco la base
        if (ctx.session.command.searching)
            return
        ctx.session.command.searching = true
        queries.Base.findByName(ctx.message.text, {}, aBase => {
            ctx.session.command.searching = false
            if (aBase == null) {
                ctx.reply('Mi spiace hai inserito una base non valida, per favore inseriscine un\' altra.')
                return
            }
            ctx.session.command.params.base.name = aBase.name;
            ctx.session.command.params.base.supervisor = aBase.roles.supervisor;
            ctx.reply('Infine, scrivi una breve descrizione della missione, per far sapere di cosa si tratta.')
            .catch(err => console.log(err))
            return ctx.wizard.next()
        });
    }),
    new Composer()
    .on('text', ctx => {
        ctx.session.command.params.description = ctx.message.text
        return ctx.scene.leave()
    }))
    .leave(ctx => {
        if (ctx.message.text === '/cancel') {
            ctx.reply('Richiesta missione annullata.')
            return
        }
        // TODO: non sono sicuro sia il caso di rinotificare chi l'ha richiesta visto che è un dato che non teniamo nel DB
        ctx.reply('La richiesta è stata inoltrata con successo. Verrai notificato nel caso la missione venga accettata.')
        .then(ctx.reply(`Ecco intanto un riepilogo sui dati della missione:\n\nData prevista: ${utils.Date.format(ctx.session.command.params.date, 'DD-MM-YYYY')}\nBase di partenza: ${ctx.session.command.params.base.name}\nResponsabile: ${ctx.session.command.params.base.supervisor}\nDescrizione: ${ctx.session.command.params.description}`))
        .catch(err => console.log(err))

        // Mando il messaggio al base supervisor che deve ricevere la notifica
        queries.Personnel.findById(ctx.session.command.params.base.supervisor, {}, aSupervisor => {
            eventEmitters.Bot.emit('requestMission', {supervisor: aSupervisor, params: ctx.session.command.params})
        })
})


module.exports = requestMission
