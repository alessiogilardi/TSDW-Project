/**
 * Modulo che gestisce l'evento: requestMission.
 * 
 * Il modulo si occupa di gestire gli eventi conseguenti alla richiesta di una missione:
 * 1 - Invia una notifica al baseSup della missione richiedendo di prenderla in carico
 *      - Recupera il telegramId dal DB
 *      - Genera il messaggio con un pulsante per l'evento corrispondente
 * 2 - Inserisco l'evento nell'EventLog 
 */

const utils     = require('../../utils')
const queries   = require('../../db/queries')
const Telegraf  = require('telegraf')
const bf        = require('../../bot/bot-functions')
const Personnel = queries.Personnel
const zip       = bf.zip
const EventLog = queries.EventLog

/**
 * Funzione che gestisce l'evento MissionRequested, che viene richiamato quando c'è richiesta di
 * una missione.
 * @param {Telegraf} bot 
 * @param {Array} missions Array di missioni, nel caso la missione duri più di un giorno
 */
const onMissionRequested = async (bot, missions) => {
    if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')
    this.bot = bot
    var am         = await Personnel.findById(missions[0].AM, 'telegramData.idTelegram')
    var supervisor = await Personnel.findById(missions[0].supervisor, 'telegramData.idTelegram')

    // TODO: la missione deve essere aggiunta alle requested missions del baseSup

    for (let mission of missions) {
        var message = `C'è una richiesta di missione:\n\n`+
        `Data: ${utils.Date.format(mission.date, 'DD MMM YYYY')}\n` +
        `Scenario: ${mission.description.riskEvaluation.scenario}\n` +
        `Difficoltà: ${mission.description.riskEvaluation.level}\n`

        // Definisco il bottone da mandare al Responsabile di Base
        var buttonMessage = 'Vuoi iniziare ad organizzare la missione?'
        var buttonText    = 'Organizza'
        var buttonData    = zip['organizeMission'] + ':' + mission._id + ':' + am.telegramData.idTelegram

        await this.bot.telegram.sendMessage(supervisor.telegramData.idTelegram, message)
        await this.bot.telegram.sendLocation(supervisor.telegramData.idTelegram, mission.location.latitude, mission.location.longitude)
        // Invio il bottone, premendolo il baseSup entrerà nella scene
        await this.bot.telegram
        .sendMessage(supervisor.telegramData.idTelegram, buttonMessage, Telegraf.Extra
            .markdown()
            .markup(m => m.inlineKeyboard([
                m.callbackButton(buttonText, buttonData)
        ])))
		
		let mEvent = { type: 'missionRequested', actor: mission.AM, subject: {type: 'Mission', _id: mission._id}, timestamp: new Date() }
		EventLog.insert(mEvent)
  
}
    }
}

module.exports = onMissionRequested


