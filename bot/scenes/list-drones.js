require('dotenv').config()
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')

// Modello da seguire:
const command = {
    name: undefined,
    error: undefined,
    searching: undefined,
    base: undefined
}

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
    .on('text', async ctx => {
        let choice = ctx.message.text
        if (!['1','2','3','4'].includes(choice)) {
            ctx.reply('Il filtro inserito non è valido, per favore reinseriscilo')
            return
        }

        // Selezione della query, che dipende dalla scelta del manutentore
        let today = new Date().setHours(0, 0, 0, 0)                      // data di oggi senza ore, minuti, secondi e millisecondi
        let selection = {
            '1': {base: ctx.scene.state.command.base},
            '2': {base: ctx.scene.state.command.base, 'missions.waitingForQtb.date': today},
            '3': {base: ctx.scene.state.command.base, 'missions.waitingForQtb.date': {$ne: today}},
            '4': {base: ctx.scene.state.command.base, $and: [{'state.maintenance.start': {$gte: today}}, {'state.maintenance.end': {$lte: today}}]}
        }

        let drones = await queries.Drone.find(selection[choice], '')
        ctx.reply('Ecco i risultati:\n'+JSON.stringify(drones))

        return ctx.scene.leave()
    })
).leave(ctx => {
    if (ctx.message.text === '/cancel') {
        ctx.reply('Richiesta missione annullata.')
        delete ctx.scene.state.command
        return
    }
})

module.exports = listDrones
