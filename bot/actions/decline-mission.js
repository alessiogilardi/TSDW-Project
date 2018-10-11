const decline = () => ctx => (ctx, next) => {
    console.log('Missione rifiutata')
	ctx.answerCbQuery('Missione rifiutata')
	ctx.editMessageReplyMarkup({})
}

module.exports = decline