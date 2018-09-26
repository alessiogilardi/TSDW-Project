require('dotenv').config();
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { leave } = Stage

// Greeter scene
const greeter = new Scene('greeter')

greeter.enter((ctx) => {
  ctx.reply('Hi');
});
greeter.leave((ctx) => ctx.reply('Bye'))
//greeter.hears(/hi/gi, leave())
greeter.hears('Hi', (ctx) => ctx.reply('Ciao siamo nella scena greeter'))
greeter.on('message', (ctx) => ctx.reply('Send `hi`'))

// Create scene manager
const stage = new Stage()
stage.command('cancel', leave())

// Scene registration
stage.register(greeter)

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
bot.use(session())
bot.use(stage.middleware())
bot.command('greeter', (ctx) => ctx.scene.enter('greeter'))
bot.hears('Hi', ctx => ctx.reply('Saluto generico'))

bot.startPolling()