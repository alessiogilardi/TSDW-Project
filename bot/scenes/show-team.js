
const WizardScene   = require('telegraf/scenes/wizard/index')
const Composer      = require('telegraf/composer')
const utils     = require('../../utils')
const queries   = require('../../db/queries')
const Mission   = queries.Mission
const Personnel = queries.Personnel



const showTeam = new WizardScene('showTeam',
    async ctx => {
        ctx.scene.state.mission = await Mission.findById(ctx.scene.state.mission._id, '')
        const accepted  = ctx.scene.state.mission
        ctx.scene.state.personnel = { loaded: [], chosen: [] }
        for (let person of accepted) {
            let tmp = utils.copyObject(await Personnel.findById(person._id))
            tmp.roles = person.roles
            ctx.scene.state.personnel.loaded.push(tmp)
        }
        await ctx.reply('Scegli tra queste persone chi aggiungere al team della missione.\n' +
                        'Il primo Pilota che sceglirìerai sarà il Pilot in Chief.')
        // Mostro le persone
        const personnel = ctx.scene.state.personnel.loaded
        for (let i in personnel) {
            const message = `${personnel[i].name} ${personnel[i].surname}`

            await ctx.reply(message, Telegraf.Extra
                .markdown()
                .markup(m => {
                    const roles = personnel[i].roles
                    let buttons = []
                    for (let j in roles) {
                        const buttonText = `Aggiungi come ${roles[j]}`
                        const buttonData = `${zip['addToTeam']}:${i}:${j}` // Persona -> i ; Ruolo -> j
                        buttons.push(m.callbackButton(buttonText, buttonData))
                    }
                    m.inlineKeyboard([buttons])
                }
            ))
        }
    },
    new Composer((ctx, next) => {
        // Codice che ignora i comandi che non fanno parte di questa Scene
        if (ctx.updateType === 'message' && ctx.updateSubTypes.includes('text')) {
            if (ctx.message.text !== '/end') { return }
        }
        return next()
    })
    .on('callback_query', ctx => { // Rispondo alla pressione di un bottone e aggiungo la persona al team con un ruolo
        const parts = ctx.callbackQuery.data.split(':')
        if (unZip[parts[0]] !== 'addToTeam') { return }
    
        ctx.answerCbQuery('Aggiunto al team')
        ctx.editMessageReplyMarkup({})
        const i      = parts[1]
        const j      = parts[2]
        const loaded = ctx.scene.state.personnel.loaded

        let   chosen = loaded[i]
        chosen.role  = chosen.roles[j]
        ctx.scene.state.personnel.chosen.push(chosen)
    })
    .command('end', async ctx => {
        let pilotCount = 0
        let maintCount = 0
        const chosen = ctx.scene.state.personnel.chosen
        if (ctx.scene.state.mission.description.duration.expected < 3) {
            for (let person of chosen) {
                if (person.role === 'pilot') { pilotCount++ }
            }
            if (pilotCount !== 2) {
                return await ctx.reply('Devi scegliiere 2 piloti daaggiungere al Team.')
            }
            return ctx.scene.leave()
        }
        for (let person of chosen) {
            if (person.role === 'pilot')      { pilotCount++ }
            if (person.role === 'maintainer') { maintCount++ }
        }
        if (pilotCount !== 2) {
            return await ctx.reply('Devi scegliiere 2 piloti daaggiungere al Team.')
        }
        if (maintCount !== 1) {
            return await ctx.reply('Devi scegliiere 1 manutentore daaggiungere al Team.')
        }
        return ctx.scene.leave()
    })
    .leave(ctx => {
        // Inserisco i dati nel DB
    }))

module.exports = showTeam