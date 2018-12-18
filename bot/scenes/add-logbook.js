//import { Personnel } from '../../db/queries'
import { Mission, Logbook } from '../../db/queries'
import { Composer } from 'telegraf'

/**
 * Scene che gestisce l'inserimento di LogBook per le Missioni in cui manca
 */

const addLogbook = new WizardScene('addLogbook', 
    async ctx => {
        // Qui elenco le missioni in Personnel.missions.pilot.waitingForLogbook

        const person                = ctx.session.userData.person //await Personnel.findByIdTelegram(ctx.message.chat.id)
        ctx.scene.state.missions    = await Mission.find({ _id: { $in: person.missions.pilot.waitingForLogbook } })
        ctx.scene.state.currentMission = undefined
        
        for (let i in missions) {
            // Invio un Button per ogni missione
        }

        return ctx.wizard.next()
    },
    new Composer((ctx, next) => {
        return next()
    })
    .on('callback_query', async ctx => {
        const parts = ctx.callbackQuery.data.split(':')
        if (parts[0] !== 'addToTeam') { return }

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
         */
        Logbook.insert(logbook)   
    })
    .command('end', ctx => {
        ctx.scene.leave()
    })
).leave(ctx => {

})