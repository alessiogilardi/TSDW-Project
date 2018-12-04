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
const zip       = bf.zipActionName
/**
 * Funzione che invia un messaggio con bottone al Responsabile di Base
 * incaricato di organizzare la missione.
 * 
 * @param {*} idTelegram id_telegram dell'utente (Resp. di base) a cui è inviato il bottone
 * @param {*} message Messaggio da allegare al bottone
 * @param {*} buttonText Testo del bottone
 * @param {*} button Parametri del bottone
 */

 // TO DEBUG: Non riesco a mandare button con action corretta
const sendOrganizeMissionButton = (idTelegram, message, buttonText, buttonData) => {
    this.bot.telegram
    .sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup(m => m.inlineKeyboard([
            m.callbackButton(buttonText, buttonData)
    ])))
}

const onRequestMission = (bot, aMission) => {
    if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')
    this.bot = bot
    var sendMessage  = this.bot.telegram.sendMessage
    var sendLocation = this.bot.telegram.sendLocation

    // Definisco il bottone da mandare al Responsabile di Base
    var buttonMessage = 'Vuoi iniziare ad organizzare la missione?'
    var buttonText = 'Organizza'
    var buttonData = zip['organizeMission'] + ':' + aMission._id
    
    var message = `C'è una richiesta di missione:\n\n`+
        `Data: ${utils.Date.format(aMission.date, 'DD MMM YYYY')}\n` +
        `Scenario: ${aMission.description.riskEvaluation.scenario}\n` +
        `Difficoltà: ${aMission.description.riskEvaluation.level}\n`
    
    // Invio il messaggio.
    // Premendo sul bottone il Responsabile di base entrerà nella Scene preposta a gestire OrganizeMission
    Personnel.findById(aMission.supervisor, 'telegramData.idTelegram')
    .then(supervisor => {
        var idTelegram = supervisor.telegramData.idTelegram
        /*
        this.bot.telegram
        .sendMessage(idTelegram, message)*/
        this.bot.telegram
        .sendMessage(idTelegram, message)
        .then(() => {
            /*this.bot.telegram
            .sendLocation(idTelegram, aMission.location.latitude, aMission.location.longitude)*/
            this.bot.telegram
            .sendLocation(idTelegram, aMission.location.latitude, aMission.location.longitude)
        }
        ).then(() =>{
            sendOrganizeMissionButton(supervisor.telegramData.idTelegram,
                buttonMessage,
                buttonText,
                buttonData)}
        ).catch(err => console.log(err))  
    })

    // TODO: Inserisco l'evento nel event Log:
    // MissionRequested: aMission._id 
    // StartedBy: aMission.AM 
    // Notified: aMission.supervisor 
    
}

module.exports = onRequestMission