const models    = require('./models.js');
const queries   = require('./queries.js');

const operations = {
    INSERT: 'insert',
    DELETE: 'delete',
    UPDATE: 'update'
}

models.Base.watch()
.on('change', data => {
    if (data.operationType === operations.INSERT) {
        var base = data.fullDocument;
        AirOperator.updateById(base.airOperator, {$push: {'bases': base._id}});
    }
});

models.Personnel.watch()
.on('change', data => {
    if (data.operationType === operations.INSERT) {
        var personnel = data.fullDocument;
        // Aggiorno le occupazioni in base
        if (personnel.roles.occupation.includes('pilot'))
            Base.updateById(personnel.base, {$push: {'staff.pilots': personnel._id}});
        if (personnel.roles.occupation.includes('crew'))
            Base.updateById(personnel.base, {$push: {'staff.crew': personnel._id}});
        if (personnel.roles.occupation.includes('maintainer'))
            Base.updateById(personnel.base, {$push: {'staff.maintainers': personnel._id}});

        // Aggiorno i ruoli di comando
        if (personnel.roles.command.airOperator.includes('AM'))
            AirOperator.updateById(personnel.airOperator, {'roles.AM': personnel._id});
        if (personnel.roles.command.airOperator.includes('CQM'))
            AirOperator.updateById(personnel.airOperator, {'roles.CQM': personnel._id});
        if (personnel.roles.command.airOperator.includes('SM'))
            AirOperator.updateById(personnel.airOperator, {'roles.SM': personnel._id});
        if (personnel.roles.command.base.includes('ViceAM'))
            Base.updateById(personnel.base, {'roles.ViceAM': personnel._id});
        if (personnel.roles.command.base.includes('BaseSupervisor'))
            Base.updateById(personnel.base, {'roles.BaseSupervisor': personnel._id});
    }
});
    
models.Drone.watch
.on('change', data => {
    if (data.operationType === operations.INSERT) {
        var drone = data.fullDocument;
        Base.updateById(drone.base, {$push: {drones: drone._id}});
    }
});

models.Mission.watch
.on('change', data => {
    if (data.operationType === operations.INSERT) {
        var mission = data.fullDocument;
        Personnel.updateById(mission.supervisor, {$push: {'missions.supervisor.pending': mission._id}});
    }
});