const WizardScene = require('telegraf/scenes/wizard/index')

const maxStages = 6
const dataStructure = {
    name: 'createMission',
    stage: 1,
    error: false,
    params: {
        baseId: undefined,
        baseSupervisor: undefined,
        date: undefined,
        expectedDuration: undefined,
        rank: undefined,
        droneTypes: undefined,
        drones: []
    }
}

// Ricreo la scena in modo più semplice

const createMission = new WizardScene('createMission',
    ctx => {
        ctx.session.command = dataStructure
        console.log(ctx.session.command)
        if (!ctx.session.command.error)
            ctx.reply('Inserisci la data della missione')
            .then(() => ctx.wizard.next())
        else {
            ctx.session.command.error = false
            ctx.reply('Errore, reinserisci la data')
            .then(() => ctx.wizard.next())
            .catch(err => console.log(err))
        }
    },
    ctx => {
        if (ctx.message.text == 'data'){
            if (!ctx.session.command.error)
                ctx.reply('Inserisci la durata della missione')
                .then(() => ctx.wizard.next())
            else {
                ctx.session.command.error = false
                ctx.reply('Errore, reinserisci la durata')
                .then(() => ctx.wizard.next())
                .catch(err => console.log(err))
            }
        } else {
            ctx.session.command.error = true
            ctx.wizard.back();
            return ctx.wizard.steps[ctx.wizard.cursor](ctx); 
        }
    },
    ctx => {
        ctx.scene.leave();
    }
)



/*************************************** */
/*
const createMission = new WizardScene('createMission',
    ctx => {
        ctx.session.command = dataStructure
        console.log()
        if (!ctx.session.command.error)
            ctx.reply('Bene, iniziamo la creazione della missione!\nTi ricordo che puoi annullare in qualsiasi momento usando il comando /cancel.')
            .then(() => ctx.reply('Ti verrà ora chiesto di inserire alcuni parametri.')
            .then(() => ctx.reply('Inserisci la data della missione:'))
            .then(() => ctx.wizard.next()))
            .catch(err => console.log(err))
        else
            ctx.session.error = false
            ctx.reply('Mi spiace, la data inserita non è valida.\nPer favore reinseriscila.')
            .then(() => ctx.wizard.next())
            .catch(err => console.log(err))
    },
    ctx => {
        // Controllo che abbia inserito una data
        if (ctx.message.text == 'date'){        
            if (!ctx.session.command.error) {
                ctx.session.command.params.date = ctx.message.text;
                ctx.session.command.stage = 2;
                ctx.reply('Ok, inserisci ora la durata prevista della missione:')
                .then(() => ctx.wizard.next())
                .catch(err => console.log(err))
            } else {
                ctx.reply('Reinserisci la durata')
                .then(() => ctx.wizard.next())
                .catch(err => console.log(err))
            }
        } else {
            ctx.session.command.error = true
            ctx.wizard.back();
            return ctx.wizard.steps[ctx.wizard.cursor](ctx); 
        }

    },
    ctx => {
        ctx.session.command.params.expectedDuration = ctx.message.text;
        ctx.session.command.stage = 3;
        //console.log(ctx.session.command)
        ctx.reply('Bene abbiamo quasi finito.\nSolo qualche altra informazione.')
        .then(() => ctx.reply('Che Rank ha la missione?\nIn questo modo potrò scegliere tra i piloti adatti.'))
        .then(() => ctx.wizard.next())
        .catch(err => console.log(err));
    },
    ctx => {
        if (ctx.message.text == 5) {
            ctx.session.command.params.rank = ctx.message.text;
            ctx.session.command.stage = 4;
            ctx.reply('Un\'ultima domanda. Quale tipo di drone occorre usare per questa missione?')
            .then(() => ctx.reply('Potrai segliere tra un elenco di quelli disponibili in base al tipo scelto.'))
            .then(() => ctx.wizard.next())
            .catch(err => console.log(err));
        } else {
            // Modo errato di gestire la cosa
            // Inserire un metodo per capire quando entro nella funzione se ci sono entrato 
            // dopo un errore o se è la prima volta
            ctx.wizard.back();
        }
    },
    ctx => {
        ctx.session.command.params.droneTypes = ctx.message.text;
        ctx.session.command.stage = 5;
        ctx.reply('Quali droni vuoi utilizzare? Inserisci i loro numeri separandoli con una virgola.')
        .then(() => ctx.wizard.next())
        .catch(err => console.log(err));
    },
    ctx => {
        ctx.session.command.params.drones.push(ctx.message.text);
        ctx.session.command.stage = 6;
        console.log('Stage numero: ' + ctx.session.command.stage);
        ctx.reply('Abbiamo terminato, ora notificherò il personale.\nTi contatterò quando avremo un numero sufficiente di persone disponibili')
        .then(() => ctx.scene.leave())
        .catch(err => console.log(err));
    }
)
*/
createMission.leave(ctx => {
    // Controllo il numero di stage e in base a quello capisco se l'inserimento è andato a buon fine
    // o se è stato annullato
    if (ctx.session.command.stage == maxStages)
        ctx.reply('Missione creata!')
        .then(ctx.reply(JSON.stringify(ctx.session.command)))
        .catch(err => console.log(err))
    else
        ctx.reply('Creazione annullata!');
});


module.exports = createMission