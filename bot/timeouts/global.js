const Telegraf  = require('telegraf')
const timers    = require('timers')
const fs        = require('fs')
const utils     = require('../../utils')

/**
 * Funzione che, dopo un certo tempo, se ancora non c'è il numero sufficiente di persone per formare un team, notifica il base
 * supervisor e chiede se vuole abortire al missione
 */
const checkGlobalTimeout = async (bot) => {
    timers.setInterval(async () => {
        // Carico il file con i timeout
        let timeout_file = JSON.parse(fs.readFileSync('timeouts.json', 'utf8'))
        // Controllo le missioni che ancora non hanno un team
        let now = new Date().getTime()
        let missions = await Mission.find({ 'notified.global': false, 'status.waitingForTeam.value': true, 'status.teamCreated.value': false, 'status.aborted.value': false}, '')
        for (let m of missions) {
            let missionReq  = new Date(m.status.requested.timestamp).getTime()
            let missionDate = new Date(m.date).getTime()
            let missionTeamReq  = new Date(m.status.waitingForTeam.timestamp).getTime()
            // Se la differenza tra la data della missione e la data della richiesta è minore di 12 ore, usiamo il timeout breve
            // altrimenti si usa il timeout lungo
            let timeout = 0
            if (missionDate - missionReq < 12 * 60 * 60 * 1000) // 12 ore * 60 min all'ora * 60 sec al min * 1000 msec al sec
                timeout = timeout_file.global.short
            else
                timeout = timeout_file.global.long
            // Se il timeout è superato, si notifica il base supervisor (distanza di tempo tra ora e quando sono state mandate le richieste)
            if (now - missionTeamReq >= timeout * 60000) {
                // invio messaggio al BS
                let bs = await Personnel.findById(m.supervisor, 'telegramData.idTelegram')
                let message = `La missione programmata per il giorno ${utils.Date.format(m.date, 'DD MMM YYY kk:mm')} non ha ancora un team pronto.\n` +
                `Vuoi annullare la missione?`
                bot.telegram.sendMessage(bs.telegramData.idTelegram, message, Telegraf.Extra
                    .markdown()
                    .markup( m => m.inlineKeyboard([
                        m.callbackButton('Abort', `${m._id}`)
                ])))
                Mission.updateById(m._id, { $set: { 'notified.global': true } })
            }
        }
    }, 1 * 60000)
}

module.exports = checkGlobalTimeout