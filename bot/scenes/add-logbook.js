const { Mission, Logbook } = require('../../db/queries')
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')

/**
 * Scene che gestisce l'inserimento di LogBook per le Missioni in cui manca
 */

const addLogbook = new WizardScene('addLogbook', 
    async ctx => {
        // Qui elenco le missioni in Personnel.missions.pilot.waitingForLogbook
        //
        // Riscrivo
        const person    = ctx.session.userData.person
        const missions  = await Mission.find({ _id: { $in: person.missions.pilot.waitingForLogbook } })
        if (missions.length === 0) {
            await ctx.reply('Non ci sono logbook da aggiungere!')
            return ctx.scene.leave()
        }
        for (const [i, mission] of missions.entries()) {
            const message       = `Missione del ${mission.date}`
            const buttonText    = 'Aggiungi Logbook'
            const buttonData    = `${'addLogbook'}:${i}`
            await ctx.reply(message, Telegraf.Extra
                .markdown()
                .markup(m => m.inlineKeyboard([
                    m.callbackButton(buttonText, buttonData)
                ])
            ))
        }

        ctx.scene.state.missions        = missions
        ctx.scene.state.currentMission  = undefined

        return ctx.wizard.next()
    },
    new Composer((ctx, next) => {
        // TODO: devo scartare gli input non validi
        return next()
    })
    .on('callback_query', async ctx => {
        // Se ho già selezionato una missione scarto l'input
        if (ctx.scene.state.currentMission) { 
            return ctx.answerCbQuery('Hai già selezionato una missione!')
        }

        const parts = ctx.callbackQuery.data.split(':')
        if (parts[0] !== 'addLogbook') { return }

        ctx.scene.state.currentMission = ctx.scene.state.missions[parts[1]]
        await ctx.editMessageReplyMarkup({})
        await ctx.reply('Inserisci il numero di protocollo del Logbook:')
    })
    .on('text', ctx => {
        if (!ctx.scene.state.currentMission) { return }

        const mission = ctx.scene.state.currentMission
        ctx.scene.state.currentMission = undefined
        const logbook = {
            documentRef:    ctx.message.text,
            pilot:          ctx.session.userData.person._id,
            mission:        mission._id
        }
        /**
         * La funzione Logbook.insert():
         *  1. Inserisce automaticamente il Logbook nella missione
         *  2. Setta come completata la missione nei dati del pilota
         *  3. Lancia la funzione di controllo che verifica se tutta la documentazione è stata inserita
         */
        Logbook.insert(logbook)   
    })
    .command('end', ctx => {
        ctx.scene.leave()
    })
).leave(ctx => {

})

module.exports = addLogbook