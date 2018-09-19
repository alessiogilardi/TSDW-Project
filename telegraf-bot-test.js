require('dotenv').config();
const Telegraf = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply('Telegram bot started!'));
bot.help((ctx) => ctx.reply('Command list: ...'));
bot.hears('Hi', (ctx) => {
    ctx.reply('Hey there');
    ctx.telegram.sendMessage(ctx.message.from.id, 'Ciao scemo');
});

bot.startPolling();