require('dotenv').config()
const WizardScene   = require('telegraf/scenes/wizard/index')
const moment        = require('moment')
const Composer      = require('telegraf/composer')
const utmObj        = require('utm-latlng');
const queries       = require('../../db/queries')
const schemas       = require('../../db/schemas')
const ee            = require('../../events/event-emitters')
const utils         = require('../../utils')

const utm     = new utmObj()
const Base    = queries.Base
const Mission = queries.Mission

// TODO: gestire errori ed eccezioni, gestire in questi casi l'uscita dalla Scene

// Modello da seguire:
const command = {
    name: undefined,
    error: undefined,
    searching: undefined,
    base: undefined
}

/**
 * Funzione che richiede una nuova missione e fa partire l'iter corrispondente.
 * 
 * Si richiedono:
 *  1. Data della missione
 *  2. Base di partenza
 *  3. Location di inizio della missione
 *  4. Descrizione
 *      - Durata prevista -> usata per generare più missioni e aggiungere Manutentori
 *      - Valutazione di rischio
 * 
 * Azioni da eseguire in seguito:
 *  - Settare a true il campo Instantiated della missione
 *  - Aggiungere il timestamp a tale campo
 *  - Inserire l'evento nel eventsLog
 *  - Notificare il baseSup con i parametri della Missione
 */

const listDrones = new WizardScene('listDrones',
    async ctx => {
        ctx.scene.state.command = command

        ctx.scene.state.command.name      = 'listDrones'
        ctx.scene.state.command.searching = false
        ctx.scene.state.command.error     = false
        ctx.scene.state.command.base      = ctx.session.userData.person.base
        
        await ctx.reply('Seleziona un filtro per la ricerca:\n'+
                        '1) Tutti i droni della tua base\n'+
                        '2) Solo i droni in missione'+
                        '3) Solo i droni disponibili'+
                        '4) Solo i droni in manutenzione')
        
        ctx.wizard.next()
    },
    new Composer()
    .on('text', ctx => {
        let choice = ctx.message.text
        if (!['1','2','3','4'].includes(choice)) {
            ctx.reply('Il filtro inserito non è valido, per favore reinseriscilo')
            return
        }

        // Selezione della query, che dipende dalla scelta del manutentore
        let selection = {
            '1': {base: ctx.scene.state.command.base},
            '2': {base: ctx.scene.state.command.base, 'state.availability': 1},
            '3': {base: ctx.scene.state.command.base, 'state.availability': 0},
            '4': {base: ctx.scene.state.command.base, 'state.availability': 2}
        }

        let drones = await queries.Drone.find(selection[choice], '')
        ctx.reply('Ecco i risultati:\n'+JSON.stringify(drones))

        return ctx.wizard.next()
    })
).leave(ctx => {
    if (ctx.message.text === '/cancel') {
        ctx.reply('Richiesta missione annullata.')
        delete ctx.scene.state.command
        return
    }
})

module.exports = requestMission
