/**
 * Scene per la procedura di Organizzazione di una Missione.
 * Un responsabile di base quando preme il Botton con action organizeMission 
 * entra in questa Scene dove dovrà inserire le informazioni mancanti sulla Missione.
 * L'AM deve essere notificato quando si viene iniziata questa procedura in modo da essere sicuro che
 * il baseSup abbia preso in carico la missione.
 */

const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')
const Mission 		= queries.Mission
const Drone			= queries.Drone

// Quando parte inizio a cricare i dati sulla missione e a cercare i droni e chiedo di attendere
// Intanto passo allo step successivo
// Lo step 2 è on(Text) se sto cercando non faccio nulla
// se non sto cercando sono pronto ad accettare i comandi

// Sullo step 2 devo stabilire su cosa reagire perché potei mostrare una lista di droni e con relativo
// Button e decidere così quali aggiungere.

const organizeMission = new WizardScene('organizeMission',
    async ctx => {
        ctx.reply('Sto ricercando i droni disponibili, attendi per favore...')
        ctx.scene.state.mission = await Mission.findById(ctx.scene.state.mission._id, '')

        var mission   = ctx.scene.state.mission
        //var scenario  = mission.description.riskEvaluation.scenario
        //var riskLevel = mission.description.riskEvaluation.riskLevel

        var drones = await Drone
        .find({ base: mission.base,
            'state.availability': { $ne: 2 }, 
            'missions.waitingForQtb.date': { $ne: mission.date } })
        
        ctx.scene.state.drones = { loaded: drones }
        for (let drone of drones) {
            ctx.reply(drone)
        }

        return ctx.wizard.next()
    },
    ctx => {
        // TODO: RINCOMINCIA QUI!!!
        // Stampo i droni trovati
        //ctx.scene.state.drones.loaded.forEach(drone => ctx.reply(drone)) // Invio i dati su droni e relativo Button
        // I Button scatenano un action che spero venga intercettata dal router principale
        // A questo punto spero che il router ripassi la palla qui e che lasci gestire
        // a on('addDroneToMission')

        // Il dato passato al button potrebbe essere semplicemente l'indice del drone nell'array dei
        // droni loaded
        //return ctx.wizard.next()
        return ctx.scene.leave()
    },
    new Composer()
    .on('addDroneToMission', ctx => {
        // DO SOMETHING
    })
).leave(ctx => {
    ctx.reply('Ciao!')
    console.log('Leaving organizeMission')
})

module.exports = organizeMission