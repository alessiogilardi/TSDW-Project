- Notifico il personale adatto
- Lo aggiungo a quello Notificato nella missione -> setAsNotified()
- Registro un evento in questo modo
     -> m.callbackButton('Accetta', JSON.parse(data))
     -> bot.on('callback_query', ctx => {
         // Code here...
     })
- Quando è premuto accept setto l'utente come accepted e come unavailable
- Ogni volta che qualcuno accetta controllo se sono in numero sufficiente a notificare il Supervisore
- Dico al supervisore chi ha accettato dicendo i ruoli che può fare
- Mando Bottoni al Sup. con cui può selezionare del personale con un certo ruolo