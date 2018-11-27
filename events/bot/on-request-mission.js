/**
 * Modulo che gestisce l'evento: requestMission.
 * 
 * Il modulo si occupa di gestire gli eventi conseguenti alla richiesta di una missione:
 * 1 - Invia una notifcica al baseSup della missione richiedendo di prenderla in carico
 *      - Recupera il telegramId dal DB
 *      - Genera il messaggio con un pulsante per l'evento corrispondente
 * 2 - Inserisco l'evento nell'EventLog 
 */

/**
 * Funzione che invia un messaggio di notifica con relativo pulsante al Responsabile di Base,
 * incarcato di organizzare la missione
 * 
 * @param {*} idTelegram TelegramId del Responabile di base
 * @param {*} message Messaggio da allegare
 */
const notifyBaseSup = (idTelegram, message) => {
    this.bot.telegram
    .sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup( m => m.inlineKeyboard([
            m.callbackButton('Accetta', JSON.stringify({action: 'acceptMission', cbMessage: 'Missione accettata', data: {mission: {_id: this.mission._id, date: this.mission.date}, role: role}})),
            m.callbackButton('Rifiuta', JSON.stringify({action: 'declineMission'}))
    ])))
}

const onRequestMission = (bot, aMission) => {
    if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')
    this.bot = bot

    //
    
    //bot.telegram.sendMessage(data.supervisor, `E' stata richiesta una missione con i seguenti dati:\nData prevista: ${utils.Date.format(data.params.date, 'DD-MM-YYYY')}\nBase di partenza: ${data.params.base.name}\nDescrizione: ${data.params.description}`)
    
}

module.exports = onRequestMission