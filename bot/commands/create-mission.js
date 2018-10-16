const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')
const schemas       = require('../../db/schemas')
const utils         = require('../../utils')

// TODO: va formattato l'output quando mostro i droni disponibili (decidere cosa mostrare e come)
// TODO: gestire il formato della data

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

const createMission = new WizardScene('createMission',
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
        // Parso la data inserita e la verifico                
        if (!utils.Date.isValid(ctx.message.text)) {
            ctx.reply('La data inserita non è valida, per favore reinseriscila')
            return
        }

        ctx.session.command.params.date = utils.Date.parse(ctx.message.text)
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
        .then(() => ctx.reply(`Inserisci il tipo di drone più adatto. Ti elencherò quelli disponibili.\nI tipi di drone sono:\n${schemas.droneTypes.join(', ')}`))
        .catch(err => console.log(err))
        return ctx.wizard.next()
    }),
    new Composer()
    .on('text', ctx => {
        // Se sto eseguendo la query nel db ignoro l'input in questa fase
        if (ctx.session.command.searching)
            return
        //if (!isValidDroneType(ctx.message.text)) {
        if (!schemas.droneTypes.includes(ctx.message.text)) { // controllo che il tipo di drone sia un tipo esistente
            ctx.reply('Mi spiace, ma il tipo di drone che hai inserito non è valido, controlla meglio i tipi disponibili e inseriscine uno diverso')
            return
        }
        ctx.session.command.params.droneTypes = ctx.message.text
        ctx.session.command.searching = true
        ctx.reply('Va bene, sto cercando i droni, aspetta...')
        // TODO: i droni vanno selezionati scartando quelli che hanno data di una missione uguale alla data della missione che sto creando
        queries.Drone.findByType(ctx.session.command.params.droneTypes, {base: ctx.session.userData.person.base, 'state.availability': {$ne: 2}, 'missions.waitingForQtb.date': {$ne: ctx.session.command.params.date}}, {}, drones => {
            ctx.session.command.params.drones.loaded = drones
            ctx.session.command.searching = false
            if (ctx.session.command.params.drones.loaded === null || 
                ctx.session.command.params.drones.loaded.length === 0) {
                ctx.reply('Non ho trovato nessun drone disponibile, prova ad inserire un tipo differente.')
                return
            }
            ctx.reply('Ecco i droni che ho trovato:')
            .then(() => ctx.session.command.params.drones.loaded.forEach(drone => ctx.reply(drone))) // TODO: Formattare output per i droni
            .then(() => ctx.reply('Scrivi i numeri di targa dei droni che vuoi inserire separati da virgola'))
            .catch(err => console.log(err))
            return ctx.wizard.next()
        })
    }),
    new Composer()
    .on('text', ctx => {
        // * Va generato un array con le targhe(number) dei droni caricati 
        // * in modo da verificare che quelli scelti siano tra quelli caricati
        var chosenNumbers = ctx.message.text.split(',').map(s => s.trim()) // Droni che voglio inserire nella missione
        var loadedNumbers = Array.from(ctx.session.command.params.drones.loaded, drone => drone.number)
       
        if (chosenNumbers === undefined ||
            chosenNumbers === null ||
            chosenNumbers.length === 0 ||
            !utils.arrayContainsArray(loadedNumbers, chosenNumbers)) {
            ctx.reply('I droni che hai inserito non sono validi, per favore riprova.')
            return
        }
        ctx.session.command.params.drones.chosen = chosenNumbers
        return ctx.scene.leave()
    }))
    .leave(ctx => {
    if (ctx.session.command.params.drones.chosen === null ||
        ctx.session.command.params.drones.chosen.length === 0) {
        ctx.reply('Creazione missione annullata.')
        return
    }  
    ctx.reply('La missione è stata creata con successo!\nTi ricontterò appena una squadra sarà disponibile.')
    .then(ctx.reply(`Ecco intanto un riepilogo sui dati della missione\n\nData: ${ctx.session.command.params.date}\nDurata prevista: ${ctx.session.command.params.expectedDuration}\nRango: ${ctx.session.command.params.rank}\nDroni scelti: ${ctx.session.command.params.drones.chosen.join(', ')}`))
    .catch(err => console.log(err))
    
    var dronesData = [] // Array che mantiene id e tipo dei droni da inserire nella missione
    ctx.session.command.params.drones.chosen.forEach(chosenDrone => {
        ctx.session.command.params.drones.loaded.forEach(loadedDrone => {
            if (loadedDrone.number === chosenDrone)
                dronesData.push({_id: loadedDrone._id, type: loadedDrone.type})
        })
    })

    queries.Mission.insert({
        //_id: null,
        date: ctx.session.command.params.date,
        base: ctx.session.userData.person.base,
        supervisor: ctx.session.userData.person._id,
        description: {
            duration: { 
                expected: ctx.session.command.params.expectedDuration
            },
            rank: ctx.session.command.params.rank,
        },
        drones: dronesData
    })

});


module.exports = createMission
