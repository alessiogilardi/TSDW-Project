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
const arrayContainsArray = (superset, subset) => {
    if (0 === subset.length || superset.length < subset.length) return false
    subset.forEach(subVal => {
        if (!superset.includes(subVal)) return false
    })
    return true
}

const stepHandlers = [
    // Provare ad usare new Composer().use()
    ctx => {
        ctx.session.command = dataStructure
        ctx.reply('Bene, iniziamo la creazione di una nuova missione!\nTi verrà chiesto di inserire alcuni parametri.')
        .then(() => ctx.reply('Ti ricordo che puoi annullare l\'operazione  in qualsiasi momento usando il comando /cancel.'))
        .then(() => ctx.reply('Inserisci la data della missione:'))
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
        .then(() => ctx.reply(`Inserisci il tipo di drone più adatto. Ti elencherò quelli disponibili.\nI tipi di drone sono:\n${droneTypes.join(', ')}`))
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
        ctx.reply('Va bene, sto cercando i droni, aspetta...')
        queries.Drone.findByType(ctx.session.command.params.droneTypes, {}, drones => {
            ctx.session.command.params.drones.loaded = drones
            ctx.session.command.searching = false
            if (ctx.session.command.params.drones.loaded === null || 
                ctx.session.command.params.drones.loaded.length === 0) {
                ctx.reply('Non ho trovato nessun drone disponibile, prova ad inserire un tipo differente.')
                return
            }
            ctx.reply('Ecco i droni che ho trovato:')
            .then(() => ctx.session.command.params.drones.loaded.forEach(drone => ctx.reply(drone))) // Formattare output per i droni
            .then(() => ctx.reply('Scrivi i numeri di targa dei droni che vuoi inserire separati da virgola'))
            .catch(err => console.log(err))
            return ctx.wizard.next()
        })
    }),
    new Composer()
    .on('text', ctx => {
        var drones = ctx.message.text.split(',').map(s => s.trim()) // Droni che voglioinserire nella missione
        var loadedNumbers = []
        var chosenNumbers = []
        ctx.session.command.params.drones.loaded.forEach(drone => loadedNumbers.push(drone.number))
        drones.forEach(drone => chosenNumbers.push(drone.number))
        //console.log(drones)
        // Va generato un array con le targhe dei droni caricati 
        // in modo da verificare che quelli scelti siano tra quelli caricati
        if (!arrayContainsArray(loadedNumbers, chosenNumbers)) {
            ctx.reply('I droni che hi inserito non sono validi, per favore riprova.')
            return
        }
        ctx.session.command.params.drones.chosen = drones
        return ctx.scene.leave()
    })
]
const createMission = new WizardScene('createMission', stepHandlers[0],stepHandlers[1],stepHandlers[2],stepHandlers[3],stepHandlers[4],stepHandlers[5])


createMission.leave(ctx => {
    if (ctx.session.command.params.drones.chosen === null ||
        ctx.session.command.params.drones.chosen.length === 0) {
        ctx.reply('Creazione missione annullata.')
        return
    }  
    ctx.reply('La missione è stata creata con successo!\nTi ricontterò appena una squadra sarà disponibile.')
    .then(ctx.reply(`Ecco intanto un riepilogo sui dati della missione\n\n${JSON.stringify(ctx.session.command)}`))
    .catch(err => console.log(err))
/*
    var dronesId = []
    ctx.session.command.params.drones.chosen.forEach(drone => dronesId.push(drone._id))
    console.log(ctx.session.command.params.drones.chosen)
    console.log(dronesId)
*/

// TODO: Valutare se consentire l'inserimento tramite numero di targa del drone e non _id

    queries.Mission.insert({
        id: null,
        date: ctx.session.command.params.date,
        base: ctx.session.userData.person.base,
        supervisor: ctx.session.userData.person._id,
        description: {
            duration: { 
                expected: ctx.session.command.params.expectedDuration
            },
            rank: ctx.session.command.params.rank,
        },
        drones: ctx.session.command.params.drones.chosen
    })

});


module.exports = createMission