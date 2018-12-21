const Telegraf      = require('telegraf')
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const queries       = require('../../db/queries')
const utils         = require('../../utils.js')

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
                        '1) Droni in missione\n'+
                        '2) Droni disponibili\n'+
                        '3) Droni in manutenzione')
        
        ctx.wizard.next()
    },
    new Composer()
    .on('text', async ctx => {
        let choice = ctx.message.text
        if (!['1','2','3'].includes(choice)) {
            ctx.reply('Il filtro inserito non è valido, per favore reinseriscilo')
            return
        }

        // Selezione della query, che dipende dalla scelta del manutentore
        let today = new Date().setHours(0, 0, 0, 0)                          // data di oggi senza ore, minuti, secondi e millisecondi
        let selection = {
            '1': {base: ctx.scene.state.command.base,
                $and: [
                    {'missions.waitingForQtb.date': today}//,                  // vedo se c'è una missione oggi
                    //{'missions.waitingForQtb': {$size: {$gt: 0}}}            // se questo array ha 0 elementi, il drone è per forza disponibile
            ]},
            '2': {base: ctx.scene.state.command.base,
                $or: [{
                    $and: [
                        {'missions.waitingForQtb.date': {$ne: today}},       // vedo se non c'è una missione oggi
                        {'state.maintenances.end': {$lt: today}}             // vedo se tutte le manutenzioni sono finite
                    ]},
                    {'missions.waitingForQtb': {$size: 0}}                   // se questo array ha 0 elementi, il drone è per forza disponibile
            ]}, // cosa succede se il campo waiting esiste ma non esiste il campo maintenances?
            '3': {base: ctx.scene.state.command.base,
                'state.maintenances.end': {$not: {$lt: today}}}              // vedo se c'è almeno una manutenzione non finita
        }

        let drones = await queries.Drone.find(selection[choice], '')
        await ctx.reply('Ecco i risultati:\n')

        for (let drone of drones) {
            let message = `Targa: ${drone.number}\nTipo: ${drone.type}`
            // Il messaggio dipende dalla scelta del manutentore
            switch (choice) {
                case '1':
                    await ctx.reply(message)
                    break
                case '2':
                    await ctx.reply(message, Telegraf.Extra
                        .markdown()
                        .markup(m => m.inlineKeyboard([
                            m.callbackButton('Inizia manutenzione', `m:${drone._id}`)  //m vuol dire che va messo in manutenzione
                        ])
                    ))
                    break
                case '3':
                    await ctx.reply(message, Telegraf.Extra
                        .markdown()
                        .markup(m => m.inlineKeyboard([
                            m.callbackButton('Fine manutenzione', `a:${drone._id}`)    //a vuol dire che va messo disponibile
                        ])
                    ))
                    break
            }
        }

        return ctx.wizard.next()
    }),
    new Composer((ctx, next) => {
        if (ctx.updateType === 'message' && ctx.updateSubTypes.includes('text')) {
            if (ctx.message.text !== '/end') return
        }
        return next()
    })
    .on('callback_query', async ctx => {
        let today = new Date().toISOString()
        today = utils.Date.parse(today)
        const parts = ctx.callbackQuery.data.split(':')
        switch (parts[0]) {
            case 'm':
                let end = utils.Date.parse('2999-12-31')
                await queries.Drone.updateById(parts[1], {$push: {'state.maintenances': {'start': today, 'end': end}}})
                await ctx.answerCbQuery('Drone ora in manutenzione')
                break
            case 'a':
                await ctx.answerCbQuery('Drone ora disponibile')
                break
        }
        ctx.editMessageReplyMarkup({})
    })
    .command('end', ctx => {
        return ctx.scene.leave()
    })
).leave(ctx => {
    ctx.reply('Uscita dalla gestione dei droni')
    delete ctx.scene.state.command
    return
})

module.exports = listDrones
