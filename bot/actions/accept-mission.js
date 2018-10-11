const accept = () => ctx => (ctx, next) => {
    console.log('Missione accettata')
	ctx.answerCbQuery('Missione accettata')
	ctx.editMessageReplyMarkup({}) 
}

module.exports = accept