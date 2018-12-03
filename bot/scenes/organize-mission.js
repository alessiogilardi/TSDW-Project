/**
 * Scene per la procedura di Organizzazione di una Missione.
 * Un responsabile di base quando preme il Botton con action organizeMission 
 * entra in questa Scene dove dovrà inserire le informazioni mancanti sulla Missione.
 */

const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const utmObj        = require('utm-latlng');
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
    ctx => {
        ctx.reply('Sto ricercando i droni disponibili, attenti per favore...')
        //var missionId = ctx.scene.state.mission._id
        ctx.scene.state.searching = true
        Mission.findById(ctx.scene.state.mission._id, {})
        .then(aMission => {
        	ctx.scene.state.mission = aMission

        	var scenario  = aMission.description.evaluationRisk.scenario
        	var riskLevel = aMission.description.evaluationRisk.riskLevel

        	// Devo poter recuperare il tipo di droni adatto più tutti quelli superiori
        	// che possono affrontare comunque una missione di questo tipo
        	// Anzi forse le taglie dei droni sono solo VL e L
        	// Nella tabella abbiamo indicato tutte le taglie di droni
        	// non sappiamo quali droni servono per una certa missione
        	// Direi di recuperare tutti i droni disponibili in base in quella data e 
        	var type = getDroneTypeByMissionRisk(scenario, riskLevel)

            Drone.find({ base: aMission.base,
                'state.availability': { $ne: 2 }, 
                'missions.waitingForQtb.date': { $ne: aMission.date } })
        })
        .then(drones => {
            ctx.scene.state.searching = false
            ctx.scene.state.drones = { loaded: drones }

            return ctx.scene.next()
        })
        .catch(err => console.log(err))

        // Carico i dati sulla missione
        //  Carico i droni disponibili e li faccio scegliere
        
    },
    ctx => {
        // TODO: RINCOMINCIA QUI!!!
        // Stampo i droni trovati
        ctx.scene.state.drones.loaded.forEach(drone => ctx.reply(drone)) // Invio i dati su droni e relativo Button
        // I Button scatenano un action che spero venga intercettata dal router principale
        // A questo punto spero che il router ripassi la palla qui e che lasci gestire
        // a on('addDroneToMission')

        // Il dato passato al button potrebbe essere semplicemente l'indice del drone nell'array dei
        // droni loaded
        return ctx.scene.next()
    },
    new Composer()
    .on('addDroneToMision', ctx => {
        // DO SOMETHING
    })
).leave(ctx => {
    ctx.reply('Ciao!')
    console.log('Leaving organizeMission')
})

module.exports = organizeMission