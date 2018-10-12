const queries =  require('../../db/queries')
/**
 * Definisco i passi da fare per accettare una missione:
 * - 
 */




const accept = () => ctx => (ctx, next) => {



    console.log('Missione accettata')
	ctx.answerCbQuery('Missione accettata')
	ctx.editMessageReplyMarkup({})
}

module.exports = accept