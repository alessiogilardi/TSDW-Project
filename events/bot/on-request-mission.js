/**
 * Modulo che gestisce l'evento onRequestMission.
 * 
 * Il modulo si occupa di gestire gli eventi conseguenti all richiesta di una missione:
 * 1 - Invia una notifcica al baseSup della missione richiedendo di prenderla in carico
 *      - Recupera il telegramId dal DB
 *      - Genera il messaggio con un pulsante per l'evento corrispondente
 * 2 - Inserisco l'evento nell'EventLog 
 */


const onRequestMission = (bot, aMission) => {
    if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')
    this.bot = bot

    //
    
    //bot.telegram.sendMessage(data.supervisor, `E' stata richiesta una missione con i seguenti dati:\nData prevista: ${utils.Date.format(data.params.date, 'DD-MM-YYYY')}\nBase di partenza: ${data.params.base.name}\nDescrizione: ${data.params.description}`)
    
}

module.exports = onRequestMission