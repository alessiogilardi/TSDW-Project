const Telegraf      = require('telegraf')
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const utils         = require('../../utils')
const ee            = require('../../events/event-emitters')
const { Mission, Personnel } = require('../../db/queries')

// DEBUG:   controllare che il team sia inserito correttamente e che
//          l'evento onTeamCreated funzioni correttamente
const createTeam = new WizardScene('createTeam',
    async ctx => {
        const mission   = await Mission.findById(ctx.scene.state.mission._id, '')
        const accepted  = mission.personnel.accepted
        const personnel = []
        for (const person of accepted) {  
            let tmp = utils.copyObject(await Personnel.findById(person._id))
            tmp.roles = person.roles
            personnel.push(tmp)
        }

        await ctx.reply('Scegli tra queste persone chi aggiungere al team della missione.\n' +
                        'Il primo Pilota che sceglierai sarà il Pilot in Chief.\n' +
                        'Usa il comando /end quando hai finito.')

        for (const [i, person] of personnel.entries()) {
            const message = `${person.name} ${person.surname}\naggiungi come:`
            const roles   = person.roles

            let   buttons = []
            for (const [j, role] of roles.entries()) {
                const buttonText = role
                const buttonData = `${zip['addToTeam']}:${i}:${j}` // Persona -> i ; Ruolo -> j
                buttons[j] = Telegraf.Markup.callbackButton(buttonText, buttonData) 
            }
        
            await ctx.reply(message, Telegraf.Extra
                .markdown()
                .markup(m => m.inlineKeyboard(buttons)                
            ))
        }

        ctx.scene.state.mission     = mission
        ctx.scene.state.personnel   = { loaded: personnel, chosen: [] }
        ctx.scene.state.pilotCount  = 0
        ctx.scene.state.maintCount  = 0
        ctx.scene.state.crewCount   = 0


        return ctx.wizard.next()
    },
    new Composer((ctx, next) => {
        // Codice che ignora i comandi che non fanno parte di questa Scene
        if (ctx.updateType !== 'callback_query' && ctx.updateType !== 'message') {
                return
        }
        if (ctx.updateType === 'message' && ctx.updateSubTypes.includes('text')) {
            if (ctx.message.text !== '/end') { return }
        }
        return next()
    })
    .on('callback_query', ctx => { // Rispondo alla pressione di un bottone e aggiungo la persona al team con un ruolo
        const parts = ctx.callbackQuery.data.split(':')
        if (unZip[parts[0]] !== 'addToTeam') { return }

        const i = parts[1]
        const j = parts[2]

        let chosen  = ctx.scene.state.personnel.loaded[i]
        chosen.role = chosen.roles[j]


        /*** Se la durata è inferiore a 3h ***/
        if (ctx.scene.state.mission.description.duration.expected < 3) {

            // Se sto inserendo un pilota
            if (chosen.role === 'pilot') {
                // Se ho già inserito 2 piloti
                if (ctx.scene.state.pilotCount === 2) {
                    return ctx.answerCbQuery('Hai già aggiunto 2 piloti!')
                }
                ctx.scene.state.pilotCount++
            }
            // Se sto inserendo un crew
            if (chosen.role === 'crew') {
                // Chiedo di inserire prima i piloti
                if (ctx.scene.state.pilotCount < 2) {
                    return ctx.answerCbQuery('Inserisci prima i piloti!')
                }
                ctx.scene.state.crewCount++
            }
            ctx.scene.state.personnel.chosen.push(chosen)
            ctx.answerCbQuery('Aggiunto al team')
            ctx.editMessageReplyMarkup({})
            return
        }

        /*** Se la durata è superiore a 3h ***/

        // Se sto inserendo un pilota
        if (chosen.role === 'pilot') {
            // Se ho già inserito 2 piloti
            if (ctx.scene.state.pilotCount === 2) {
                return ctx.answerCbQuery('Hai già aggiunto 2 piloti!')
            }
            ctx.scene.state.pilotCount++
        }

        // Se sto inserendo un crew
        if (chosen.role === 'crew') {
            // Chiedo di inserire prima i piloti
            if (ctx.scene.state.pilotCount < 2) {
                return ctx.answerCbQuery('Inserisci prima i piloti!')
            }
            // Chiedo di inserire prima almeno un manutentore
            if (ctx.scene.state.maintCount < 1) {
                return ctx.answerCbQuery('Inserisci prima almeno un manutentore!')
            }
            ctx.scene.state.crewCount++
        }

        // Se sto inserendo un manutentore
        if (chosen.role === 'maintainer') {
            // Chiedo di inserire prima i piloti
            if (ctx.scene.state.pilotCount < 2) {
                return ctx.answerCbQuery('Inserisci prima i piloti!')
            }
            ctx.scene.state.maintCount++
        }

        ctx.scene.state.personnel.chosen.push(chosen)
        ctx.answerCbQuery('Aggiunto al team!')
        ctx.editMessageReplyMarkup({})
    })
    .command('end', async ctx => {
        const pilotCount = ctx.scene.state.pilotCount
        const maintCount = ctx.scene.state.maintCount
        const crewCount  = ctx.scene.state.crewCount
        
        // Se ho meno di 2 piloti ne devo aggiungere
        if (pilotCount !== 2) {
            return ctx.reply('Devi scegliiere 2 piloti da aggiungere al Team.')
        }

        if (crewCount < 1) {
            return ctx.reply('Devi aggiungere almeno un crew al Team.')
        }

        // Se la durata è superiore a 3 ore e non ho aggiunto almeno un manutentore
        if (ctx.scene.state.mission.description.duration.expected >= 3 &&
            maintCount < 1) {
                return ctx.reply('Devi scegliiere almeno un manutentore da aggiungere al Team.')
        }
        
        return ctx.scene.leave()
    })
    ).leave(ctx => {
        /**
         *  1. Creo un Team
         *  2. Lo inserisco nella missione di riferimento
         *  3. La missione passa a team created
         *  4. Emetto l'evento teamCreated:
         *      1. Notifico chi è stato aggiunto alla missione
         *      2. Avviso chi non è stato scelto
         *      3. ??? Notifico l'AM della creazione del Team ???
         */
        const chosen  = ctx.scene.state.personnel.chosen
        let team = {
            pilots: {
                chief:  undefined,
                co:     undefined
            },
            crew:           [],
            maintainers:    [],
            timestamp:      new Date()
        }
        let pilotCount = 1
        for (let person of chosen) {
            if (person.role === 'pilot') { 
                if (pilotCount === 1) { team.pilots.chief = person._id }
                if (pilotCount === 2) { team.pilots.co    = person._id }
                pilotCount++
            }
            if (person.role === 'crew')       { team.crew.push(person._id) }
            if (person.role === 'maintainer') { team.maintainers.push(person._id) }
        }

        ;(async () => {
            const missionId = ctx.scene.state.mission._id
            await Mission.updateById(missionId,
                { $push: { teams: team }}, 
                { $set:  { teamCreated: { value: true, timestamp: team.timestamp }}})
            const mission = await Mission.findById(missionId)
            ctx.reply('Team creato!')
            ee.bot.emit('teamCreated', mission, team)
        })()
    })

module.exports = createTeam