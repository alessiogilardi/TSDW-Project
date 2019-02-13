const { Mission, Logbook } = require('../../db/queries')
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const Telegraf      = require('telegraf')
const utils         = require('../../utils')

/**
 * Scene che gestisce l'inserimento di LogBook per le Missioni in cui manca
 */

const addLogbook = new WizardScene('addLogbook', 
    async ctx => {
        // Qui elenco le missioni in Personnel.missions.pilot.waitingForLogbook
        
        const person    = ctx.session.userData.person
        const missions  = await Mission.find({ _id: { $in: person.missions.pilot.waitingForLogbook } })
        if (missions.length === 0) {
            await ctx.reply('Non ci sono logbook da aggiungere!')
            return ctx.scene.leave()
        }
        await ctx.reply('Missioni per cui inserire il logbook:\n(Inserisci /end quando hai finito.)')
        for (const [i, mission] of missions.entries()) {
            const message       = `Missione del ${utils.Date.format(mission.date, 'DD MMM YYYY')}`
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
        // Codice che ignora i comandi che non fanno parte di questa Scene
        if (ctx.updateType !== 'callback_query' && ctx.updateType !== 'message') {
            return
        }
        if (ctx.updateType === 'message' && ctx.updateSubTypes.includes('text')) {
            const text = ctx.update.message.text.toLowerCase()
            if (text.startsWith('/')) {
                
                if (text === '/end') {
                    
                    return next()
                }
                return
            } 
        }
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
        //if (!ctx.scene.state.currentMission) { return }

        if (!ctx.scene.state.currentMission) {
            if (ctx.message.text === '/end') {
                console.log('DEBUG: addLogbook -> /end command')
                return ctx.scene.leave()
            }
            return 
        }

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

        // Ho modificato il personale quindi invalido la sua sessione
        ctx.session.isValid = false
    })
    /*
    .command('end', ctx => {
        console.log('DEBUG: addLogbook -> /end command')
        ctx.scene.leave()
    })*/
).leave(ctx => {
    ctx.reply('Fine inserimento Logbook')
})

module.exports = addLogbook