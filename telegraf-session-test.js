require('dotenv').config();
const Telegraf = require('telegraf');
const queries = require('./queries.js');
const deasync = require('deasync');
const session = require('telegraf/session')

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
bot.use(session());

