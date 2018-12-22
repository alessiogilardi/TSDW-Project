const commands = ['/requestmission', '/createmission', '/acceptmission', '/addchiefpilot', '/addcopilot', '/addcrew', '/addqtb', '/addlogbook', '/accept', '/refuse', '/manageDrones']
const middleware = () => (ctx, next) => {
    if (ctx.updateType === 'message' && 
    ctx.updateSubType === 'text' && 
    ctx.message.text.startsWith('/')) {
            
    }
}

module.exports = middleware