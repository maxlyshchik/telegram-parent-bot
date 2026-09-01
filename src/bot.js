import { Telegraf } from 'telegraf';
import 'dotenv/config';
import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import { tips } from './tips.js';
import { generateTip } from './deepseek.js';

const { PrismaClient } = pkg;
const { Pool } = pg;

const bot = new Telegraf(process.env.BOT_TOKEN);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

bot.start(async (ctx) => {
  const tgId = String(ctx.from.id);

  // upsert – обновить или создать
  await prisma.user.upsert({
    where: { tgId },
    update: {},
    create: { tgId },
  });

  ctx.reply(`Привет, ${ctx.from.first_name}! Ты зарегистрирован.`);
});

bot.help((ctx) => ctx.reply('Я помогу тебе...'));

bot.command('about', (ctx) => {
  ctx.reply(
      '👶 Этот бот создан для родителей детей от 1 до 6 лет.\n' +
      'Мы даём идеи для игр, поделок, рецептов и книг.\n' +
      'Скоро появятся эксклюзивные материалы по подписке!'
  );
});

bot.command('tip', (ctx) => {
  const randomIndex = Math.floor(Math.random() * tips.length);
  const tip = tips[randomIndex];
  ctx.reply(tip);
});

bot.command('generate', async (ctx) => {
  await ctx.reply('⏳ Генерирую совет...');
  const tip = await generateTip();
  await ctx.reply(tip);
});

export { bot, prisma };