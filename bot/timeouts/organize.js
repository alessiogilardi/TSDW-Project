const timers    = require('timers')
const fs        = require('fs')

/**
 * Funzione che controlla le missioni non istanziate ogni minuto e notifica l'AM dopo n minuti che non viene istanziata
 */
const checkOrganizeTimeout = async (bot) => {
    timers.setInterval(async () => {
        // Carico il file con i timeout
        let timeout_file = JSON.parse(fs.readFileSync('timeouts.json', 'utf8'))
        // Controllo le missioni
        let now = new Date().getTime()
        let missions = await Mission.find({'status.requested.value': true, 'status.waitingForTeam.value': false}, '')
        for (let m of missions) {
            let missionReq  = new Date(m.status.requested.timestamp).getTime()
            let missionDate = new Date(m.date).getTime()
            // Se la differenza tra la data della missione e la data della richiesta è minore di 12 ore, usiamo il timeout breve
            // altrimenti si usa il timeout lungo
            let timeout = 0
            if (missionDate - missionReq < 12 * 60 * 60 * 1000) // 12 ore * 60 min all'ora * 60 sec al min * 1000 msec al sec
                timeout = timeout_file.organize.short
            else
                timeout = timeout_file.organize.long
            // Se il timeout è superato, si notifica l'AM
            if (now - missionReq >= timeout * 60000) { // il timeout è in minuti, quindi lo converto in msec per fare la sottrazione
                // invio notifica all'AM
                let am = await Personnel.find({'roles.command.airOperator.AM': true}, 'telegramData.idTelegram')
                bot.sendMessage(am.telegramData.idTelegram, 'Una missione non è ancora stata accettata dal responsabile di base')
            }
        }
        missions = []
    }, 1 * 60000)
}

module.exports = checkOrganizeTimeout