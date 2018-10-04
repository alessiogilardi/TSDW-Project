const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')
const schemas       = require('../../db/schemas')

// TODO: va formattato l'output quando mostro i droni disponibili (decidere cosa mostrare e come)

const dataStructure = {
    name: 'requestMission',
    error: false,
    searching: false,
    params: {
        baseName: undefined,
        date: undefined,
        description: undefined
    }
}

const arrayContainsArray = (superset, subset) => {
    if (0 === subset.length || superset.length < subset.length) return false
    subset.forEach(subVal => {
        if (!superset.includes(subVal)) return false
    })
    return true
}

const requestMission = new WizardScene('requestMission',
    ctx => {
        ctx.session.command = dataStructure
        ctx.reply('Bene, iniziamo la proceduraper la richiesta di una missione!\nTi verrà chiesto di inserire alcuni parametri.')
        .then(() => ctx.reply('Ti ricordo che puoi annullare l\'operazione  in qualsiasi momento usando il comando /cancel.'))
        .then(() => ctx.reply('Inserisci la data della missione:'))
        .catch(err => console.log(err))
        ctx.wizard.next()
    },
    new Composer()
    .on('text', ctx => {
        // Recupero il testo e verifico che sia una data
        // TODO: la data deve essere inseribile in un formato più elastico oppure deve essere spiagto il formato in cui inserirla
        // TODO: la data deve essere successiva ad oggi
        ctx.session.command.params.date = Date.parse(ctx.message.text)
        if (isNaN(ctx.session.command.params.date)) {
            ctx.reply('La data inserita è in un formato non valido, per favore reinseriscila')
            return
        }
        ctx.reply('A quale base vuoi affidare la missione? Inserisci il nome della base:')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        // Cerco la base
        queries.Base.findByName(ctx.message.text, {}, aBase => {
            if (aBase == null) {
                ctx.reply('Mi spiace hai inserito una base non valida, per favore inseriscine un\' altra.')
                return
            }
            ctx.session.command.params.baseName = aBase.name;
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
    if (ctx.message.text == '/cancel') {
        ctx.reply('Creazione missione annullata.')
        return
    }  
    ctx.reply('La richiesta è stata inoltrata con successo. Verrai notificato nel caso le missione verrà accettata')
    .then(ctx.reply(`Ecco intanto un riepilogo sui dati della missione\n\n${JSON.stringify(ctx.session.command)}`))
    .catch(err => console.log(err))
});


module.exports = requestMission
