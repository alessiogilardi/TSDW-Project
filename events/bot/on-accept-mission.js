/**
 * Modulo che gestisce l'Evento AcceptMission.
 * Il modulo si occupa di inserire il Personale che accetta la missione nei dati della missione
 * e controlla se sia già pronto un team. In caso affermativo notifica il supervisore che ha richiesto la missione.
 */
const queries = require('../db/queries')
// TODO: implementare funzione notifySupervisor
// TODO: da gestire il fatto che prima che l'utente ne accetti una potrebbero arrivargli più richieste
// di più missioni

/**
 * Funzione che controlla se è già possibile costituire un team con le persone che hanno accettato finora.
 * 
 * @param {*} aMissionId 
 */
const checkForTeam = aMissionId => {
    return new Promise((resolve, reject) => {
        queries.Mission.findById(aMissionId, aMission => {
            var pilots      = aMission.pilots.accepted
            var crew        = aMission.crew.accepted
            var maintainers = aMission.maintainers.accepted
    
            if (pilots.length < 2 || crew.length < 1)
                reject(aMission)
            if (aMission.description.duration >= 3 && maintainers.length < 1)
                reject(aMission)
            
            resolve(aMission)
        })
    })
}

/**
 * Funzione che recupera i dati sul personale che per ora ha accettato la missione
 * 
 * @param {*} supervisorId 
 * @param {*} pilotsIds 
 * @param {*} crewIds 
 * @param {*} maintainersIds 
 */
const getTeam = (supervisorId, pilotsIds, crewIds, maintainersIds = undefined) => {
    return new Promise((resolve, reject) => {
        var done = maintainersIds !== undefined ? pilotsIds.length + crewIds.length + maintainersIds.length + 1 : pilotsIds.length + crewIds.length + 1;
        var counter = 0
        var result = {
            supervisor: undefined,
            personnel: []
        } 
        /*{
            role: undefined,
            data: undefined
        }*/
        if (supervisorId !== undefined)
            queries.findById(supervisorId, supervisor => {
                if (++counter === done) resolve(result)
            })

        if (pilotsIds !== undefined)
            pilotsIds.forEach(pilotId => {
                queries.Personnel.findById(pilotId, {}, pilot => {
                    result.personnel.push({role: 'Pilot', data: pilot})
                    if (++counter === done) resolve(result)
                }) 
            })
        if (crewIds !== undefined)
            crewIds.forEach(crewId => {
                queries.Personnel.findById(crewId, {}, crewMember => {
                    result.personnel.push({role: 'Crew', data: crewMember})
                    if (++counter === done) resolve(result)
                }) 
            })
        if (maintainersIds !== undefined)
            maintainersIds.forEach(maintainerId => {
                queries.Personnel.findById(maintainerId, {}, maintainer => {
                    result.personnel.push({role: 'Maintainer', data: maintainer})
                    if (++counter === done) resolve(result)
                }) 
            })
    })
}

/**
 * Funzione che si occupa di notificare il supervisore della missione quando è pronto un team
 * 
 * @param {*} data 
 */
const notifySupervisor = () => data => {
    /* Struttura di data
    {
        supervisor: undefined,
        personnel: [{role: xxx, data: {}}]
    }
    */

    // TODO: Implementare funzione e gestore
    // Notifico il supervisore per avvisarlo che è pronta una squadra
    // Se vuole può lanciare il comando createTeam per la missione in questione:
    // Gli vengono mostrati quindi uno per uno i vari membri che hanno accettato e può decidere di aggiungerli al team
    // premendo il bottone relativo

    //    this.bot.telegram.sendMessage(data.supervisor.telegramData.idTelegram, data.personnel)
    /*
    this.bot.telegram.sendMessage(idTelegram, message, Telegraf.Extra
        .markdown()
        .markup( m => m.inlineKeyboard([
            m.callbackButton('Accetta', JSON.stringify({action: 'acceptMission', cbMessage: 'Missione accettata', data: {mission: {_id: this.mission._id, date: this.mission.date}, role: role}})),
            m.callbackButton('Rifiuta', JSON.stringify({action: 'declineMission'}))
    ])))*/
} 

/**
 * Funzione che gestisce l'evento acceptMission, richiamato quando un membro del personale accetta una missione
 * 
 * @param {*} data 
 * @param {*} ctx 
 * @param {*} bot 
 */
const acceptMission = (data, ctx, bot) => {
    /**
     * data: {
     *  mission: {
     *      _id:, // _id della missione
     *      date: // Data della missione
     *  },
     *   role: // Ruolo che la persona potrà avere nella missione (pilota, crew, manutentore)
     * }
     */
    this.bot = bot
    this.ctx = ctx

    // Il personale è aggiunto alla missione come accettato 
    // e la missione è aggiunta tra quelle accettate dalla persona
    queries.Mission[data.role].setAsAccepted(data.mission._id, ctx.session.userData.person._id, data.mission.date)
    .then(() => {
        // Verifico il personale che ha accettato la missione per ora e nel caso notifico il supervisore
        checkForTeam(data.mission._id)
        .then(aMission => {
            // Se c'è un team pronto recupero i dati e poi notifico il supervisore di base
            getTeam(aMission.supervisor, aMission.pilots.accepted, aMission.crew.accepted, aMission.maintainers.accepted)
            .then(() => notifySupervisor())
        })
        .catch(aMission => console.log('Team non ancora pronto. Occorrono più persone.'))
    })

    

}

module.exports = acceptMission