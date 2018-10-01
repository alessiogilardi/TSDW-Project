const bf = require('./bot-functions.js');

const middleware = () => (ctx, next) => {
    if (ctx.session.dataLoaded && ctx.session.isValid)
        return next()
    
    bf.loadData(ctx.message.from.id, data => {
        ctx.session.userData    = data;
        ctx.session.dataLoaded  = true;
        ctx.session.isValid     = true;
        return next();
    });
}

module.exports = middleware;