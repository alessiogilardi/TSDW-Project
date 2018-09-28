const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')

const dataStructure = {
    name: 'createMission',
    error: false,
    searching: false,
    params: {
        baseId: undefined,
        baseSupervisor: undefined,
        date: undefined,
        expectedDuration: undefined,
        rank: undefined,
        droneTypes: undefined,
        drones: {
            loaded: [],
            chosen: []
        }
    }
}

const droneTypes = ['type1', 'type2', 'type3', 'type'] // Questo sarà meglio implementato più avanti

const stepHandlers = [
    ctx => {
        ctx.session.command = dataStructure
        ctx.reply('Bene, iniziamo la creazione di una nuova missione!\nTi verrà chiesto di inserire alcuni parametri.')
        .then(() => 'Ti ricordo che puoi annullare l\'operazione  in qualsiasi momento usando il comando /cancel.')
        .then(() => 'Inserisci la data della missione:')
        .catch(err => console.log(err))
        ctx.wizard.next()
    },
    new Composer()
    .on('text', ctx => {
        // Recupero iltesto e verifico che sia una data
        ctx.session.command.params.date = Date.parse(ctx.message.text)
        if (isNaN(ctx.session.command.params.date)) {
            ctx.reply('La data inserita è in un formato non valido, per favore reinseriscila')
            return
        }
        //ctx.session.command.params.date = new Date(ctx.message.text)
        ctx.reply('Quanto durerà la missione? Inserisci la durata prevista in ore')
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        // Verifico la durata
        if (isNaN(ctx.message.text) || ctx.message.text < 0 || ctx.message.text > 24) { // Check Numeric
            ctx.reply('Mi spiace hai inserito un valore non valido, per favore inseriscine un altro.')
            return
        }
        ctx.session.command.params.expectedDuration = ctx.message.text
        ctx.reply('Ok, ci siamo quasi, solo qualche altra domanda.')
        .then(() => ctx.reply('Qual è la difficoltà della missione? In questo modo potrò scegliere i piloti adatti.\n\nInserisci un valore da 1 a 5'))
        .catch(err => console.log(err))
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        //if (!isValidRank(ctx.message.text)) {
        if (isNaN(ctx.message.text) || ctx.message.text < 1 || ctx.message.text > 5) { // Check Numeric
            ctx.reply('Ops, la difficoltà che hai inserito non è valida, inserisci un valore diverso.')
            return
        }
        ctx.session.command.params.rank = ctx.message.text // Parso il numero
        ctx.reply('Ultima cosa, i droni per la missione.Inserisci il tipo di drone più adatto.')
        .then(() => ctx.reply(`Inserisci il tipo di drone più adatto. Ti elencherò quelli disponibili.\nI tipo di drone sono:\n${droneTypes.join(',')}`))
        .catch(err => console.log(err))
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        // Se sto eseguendo la query nel db ignoro l'input in questa fase
        if (ctx.session.command.searching)
            return
        //if (!isValidDroneType(ctx.message.text)) {
        if (!droneTypes.includes(ctx.message.text)) { // controllo che il tipo di drone sia un tipo esistente
            ctx.reply('Mi spiace, ma il tipo di drone che hai inserito non è valido, controlla meglio i tipi disponibili e inseriscine uno diverso')
            return
        }
        ctx.session.command.params.droneTypes = ctx.message.text
        ctx.session.command.searching = true
        ctx.reply('Va bene, sto cercando i droni aspetta...')
        queries.Drone.findByType(ctx.session.command.params.droneTypes, {}, drones => {
            ctx.session.command.params.drones.loaded = drones
            ctx.session.command.searching = false
            if (ctx.session.command.params.drones.loaded === null || 
                ctx.session.command.params.drones.loaded.length === 0) {
                ctx.reply('Non ho trovato nessun drone disponibile, prova ad inserire un tipo differente.')
                return
            }
            ctx.reply(`Ecco i droni che ho trovato:\n${ctx.session.command.params.drones.loaded.join('\n')}`)
            .then('Scrivi i numeri di targa de droni che vuoiinserire separati da virgola')
            .catch(err => console.log(err))
            return ctx.wizard.next()
        })
    }),
    new Composer()
    .on('text', ctx => {
        var drones = ctx.message.text // Va preso il testo e generato un array di droni
        // Va generato un array con le targhe dei droni caricati 
        // in modo da verificare che quelli scelti siano tra quelli caricati
        if (!ctx.session.command.params.drones.loaded.includes(drones)) {
            ctx.reply('Droni scelti non validi, riprova')
            return
        }
        ctx.session.command.params.drones.chosen.push(drones)
        return ctx.scene.leave()
    })
]
const createMission = new WizardScene('createMission', stepHandlers)


createMission.leave(ctx => {
    // Controllo il numero di stage e in base a quello capisco se l'inserimento è andato a buon fine
    // o se è stato annullato
    if (ctx.session.command.params.drones.chosen.length === null ||
        ctx.session.command.params.drones.chosen.length === 0) {
        ctx.reply('Creazione missione annullata.')
        return
    }  
    ctx.reply('La missione è stata creata con successo!\nTi ricontterò appena una squadra sarà disponibile.')
    .then(ctx.reply(`Ecco instanto un riepilogo sui dati della missione\n${JSON.stringify(ctx.session.command)}`))
    .catch(err => console.log(err))
});


module.exports = createMission