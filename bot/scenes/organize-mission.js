/**
 * Scene per la procedura di Organizzazione di una Missione.
 * Un responsabile di base quando preme il Button con action organizeMission 
 * entra in questa Scene dove dovrà inserire le informazioni mancanti sulla Missione (Droni).
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
const ee            = require('../../events/event-emitters')
const Mission 		= queries.Mission
const Drone			= queries.Drone
const zip           = bf.zip

// TODO: DA FARE gestire comando /cancel


// TODO: quando scelgo i droni va messa la missione tra le waiting for QTB del drone
// TODO: gestire meglio caso lista droni disponibili vuota

/**
 * Funzione che organizza la missione.
 * Essa cerca i droni disponibili.
 */
const organizeMission = new WizardScene('organizeMission',
    async ctx => {
        ctx.reply('Sto ricercando i droni disponibili, attendi per favore...')
        ctx.scene.state.mission = await Mission.findById(ctx.scene.state.mission._id, '')

        const mission = ctx.scene.state.mission
        const drones  = await Drone
        .find({ base: mission.base,
            'state.availability': { $ne: 2 }, 
            'missions.waitingForQtb.date': { $ne: mission.date } })
        
        if (drones.length === 0) {
            await ctx.reply('Non ci sono droni disponibili.')
            return ctx.scene.leave()
        }
        
        ctx.scene.state.drones = { loaded: drones, chosen: [] }
        await ctx.reply('Droni disponibili:\n(Inserisci il comando /end quando hai finito.)')
        let index = 0
        for (let drone of drones) {
            const message = `Targa: ${drone.number}\nTaglia: ${drone.type}`
            const buttonText = 'Aggiungi'
            const buttonData = `${zip['addDroneToMission']}:${index++}`
            await ctx.reply(message, Telegraf.Extra
                .markdown()
                .markup(m => m.inlineKeyboard([
                    m.callbackButton(buttonText, buttonData)
                ])
            ))
        }

        return ctx.wizard.next()
    },
    new Composer((ctx, next) => {
        // Funzione che scarta gli input o i comandi non validi in questa Scene
        if (ctx.updateType === 'message' && ctx.updateSubTypes.includes('text')) {
            if (ctx.message.text !== '/end') return
        }
        return next()
    })
    .on('callback_query', ctx => { // Rispondo alla pressione di un bottone e aggiungo il drone ai droni scelti per la missione
        const parts = ctx.callbackQuery.data.split(':')

        if (unZip[parts[0]] === 'addDroneToMission') {
            ctx.answerCbQuery('Drone aggiunto')
	        ctx.editMessageReplyMarkup({})
            ctx.scene.state.drones.chosen.push(ctx.scene.state.drones.loaded[parts[1]])
        }
    })
    .command('end', ctx => { // Comando che termina l'inserimento dei droni
        if (ctx.scene.state.drones.loaded.length > 0 && ctx.scene.state.drones.chosen.length === 0) {
            return ctx.reply('Scegli almeno un drone.')
        }
        //ctx.reply('Fine procedura inserimento droni')
        ctx.scene.leave()
    })
).leave(ctx => {
    // Aggiungo i droni alla missione -> FATTO da testare
    // Setto waitingForQtb nelle missioni del drone -> FATTO da testare
    // Lo stato della missione avanza da requested passa waitingForStaff -> FATTO testare
    console.log('Leaving organizeMission')
    ctx.reply('Fine della procedura.\nSto contattando il personale di Base, sarai notificato quando è pronto un team')

    if (ctx.scene.state.drones.chosen.length > 0) {
        const mission = ctx.scene.state.mission
        let drones = []
        for (let drone of ctx.scene.state.drones.chosen) {
            drones.push({ _id: drone._id, type: drone.type })
        }
        Mission.updateById(mission._id, { $push: { 'drones': { $each: drones } }, $set: { 'status.waitingForTeam.value': true, 'status.waitingForTeam.timestamp': new Date() } })
        for (let drone of drones) {
            Drone.updateById(drone._id, { $push: { 'missions.waitingForQtb': { idMission: mission._id, date: mission.date } } })
        }
        ee.bot.emit('missionOrganized', mission)
    }
})

module.exports = organizeMission