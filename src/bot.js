import { Telegraf } from 'telegraf';
import 'dotenv/config';

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(`Привет, ${ctx.from.first_name}! Добро пожаловать в бот для родителей.`);
});

bot.help((ctx) => {
  ctx.reply('Я помогу тебе с полезными советами для детей. Скоро здесь будет больше функций!');
});

export default bot;