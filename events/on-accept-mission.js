const queries = require('../db/queries')
// TODO: da gestire il fatto che prima che l'utente ne accetti una potrebbero arrivargli più richieste
// di più missioni

const acceptMission = () => (data, ctx) => {
    switch(data.role) {
        case 'pilot':
            queries.Mission.Pilot.setAsAccepted(data.mission._id, ctx.session.userData.person._id)
            break
        case 'crew':
            queries.Mission.Crew.setAsAccepted(data.mission._id, ctx.session.userData.person._id)
            break
        case 'maintainer':
            queries.Mission.Maintainer.setAsAccepted(data.mission._id, ctx.session.userData.person._id)
            break
    }
}

module.exports = acceptMission