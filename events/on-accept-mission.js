const onCreateMission = (bot, data) => {
        if (bot === undefined || bot === null) throw new Error('Missing Telegram Bot')
        
        bot.telegram.sendMessage(data.supervisor, `E' stata richiesta una missione con i seguenti dati:\nData prevista: ${utils.Date.format(data.params.date, 'DD-MM-YYYY')}\nBase di partenza: ${data.params.base.name}\nDescrizione: ${data.params.description}`)
        
}

module.exports = onCreateMission