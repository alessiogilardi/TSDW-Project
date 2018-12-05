/**
 * Scene per la procedura di Organizzazione di una Missione.
 * Un responsabile di base quando preme il Botton con action organizeMission 
 * entra in questa Scene dove dovrà inserire le informazioni mancanti sulla Missione.
 * L'AM deve essere notificato quando si viene iniziata questa procedura in modo da essere sicuro che
 * il baseSup abbia preso in carico la missione.
 * 
 * Il baseSup aggiunge i droni alla missione, ai droni scelti va aggiunta la missione in waiting for QTB
 */

const Telegraf      = require('telegraf')
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')
const bf            = require('../bot-functions')
const Mission 		= queries.Mission
const Drone			= queries.Drone
const zip           = bf.zip

// TODO: quando scelgo i droni va messa la missione tra le waiting for QTB del drone
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
        await ctx.reply('Droni disponibili:')
        let index = 0
        for (let drone of drones) {
            //++index
            let message = `Targa: ${drone.number}\n` +
            `Taglia: ${drone.type}`
            let buttonText = 'Aggiungi'
            let buttonData = zip['addDroneToMission'] + ':' + index++
            ctx.reply(drone, Telegraf.Extra
                .markdown()
                .markup(m => m.inlineKeyboard([
                    m.callbackButton(buttonText, buttonData)
                ])
            ))
        }

        return ctx.wizard.next()
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