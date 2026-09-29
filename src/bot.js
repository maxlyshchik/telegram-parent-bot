import { Telegraf } from 'telegraf';
import 'dotenv/config';
import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import { tips } from './tips.js';
import generateTip from './deepseek.js';

const { PrismaClient } = pkg;
const { Pool } = pg;

const bot = new Telegraf(process.env.BOT_TOKEN);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SUBSCRIPTION_STARS = 100;
const SUBSCRIPTION_DAYS = 30;
const REFUND_WINDOW_DAYS = 21;
const MAX_REFUNDS = 3;

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

bot.command('subscribe', async (ctx) => {
  const userId = String(ctx.from.id);

  const user = await prisma.user.findUnique({ where: { tgId: userId } });
  if (!user) {
    await ctx.reply('Сначала зарегистрируйтесь через /start');
    return;
  }

  try {
    const invoiceLink = await bot.telegram.createInvoiceLink({
      title: `Подписка на ${SUBSCRIPTION_DAYS} дней`,
      description: 'Доступ к платным материалам для родителей',
      payload: JSON.stringify({ userId, type: 'monthly' }),
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: 'Подписка', amount: SUBSCRIPTION_STARS }],
    });

    await ctx.reply(
        `💳 Для оформления подписки на ${SUBSCRIPTION_DAYS} дней нажмите кнопку ниже:`,
        {
          reply_markup: {
            inline_keyboard: [[{
              text: `⭐️ Оплатить ${SUBSCRIPTION_STARS} Stars`,
              url: invoiceLink,
            }]],
          },
        }
    );
  } catch (error) {
    console.error('Ошибка при создании инвойса:', error);
    await ctx.reply('❌ Не удалось создать счёт. Попробуйте позже.');
  }
});

bot.on('pre_checkout_query', async (ctx) => {
  try {
    const payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload);
    const user = await prisma.user.findUnique({
      where: { tgId: String(payload.userId) },
    });
    if (!user) {
      await ctx.answerPreCheckoutQuery(false, 'Сначала зарегистрируйтесь через /start');
      return;
    }
    await ctx.answerPreCheckoutQuery(true);
  } catch (error) {
    console.error('Ошибка pre_checkout_query:', error);
    await ctx.answerPreCheckoutQuery(false, 'Ошибка валидации. Попробуйте позже.');
  }
});

bot.on('message', async (ctx) => {
  const payment = ctx.message?.successful_payment;
  if (!payment) return;

  try {
    const payload = JSON.parse(payment.invoice_payload);
    const user = await prisma.user.findUnique({
      where: { tgId: String(payload.userId) },
    });
    if (!user) {
      console.error('Платёж от незарегистрированного пользователя:', payload.userId);
      return;
    }

    const now = new Date();
    const base = user.expiresAt && user.expiresAt > now ? user.expiresAt : now;
    const expiresAt = new Date(base);
    expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DAYS);

    await prisma.user.update({
      where: { id: user.id },
      data: { subscribed: true, expiresAt },
    });

    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: payment.total_amount,
        currency: payment.currency,
        txId: payment.telegram_payment_charge_id,
        status: 'paid',
      },
    });

    await ctx.reply(`✅ Подписка активирована до ${expiresAt.toLocaleDateString('ru-RU')}!`);
  } catch (error) {
    console.error('Ошибка обработки successful_payment:', error);
    await ctx.reply('Оплата получена, но не удалось активировать подписку. Напишите в поддержку.');
  }
});

bot.command('refund', async (ctx) => {
  const userId = String(ctx.from.id);

  try {
    const user = await prisma.user.findUnique({
      where: { tgId: userId },
    });
    if (!user) {
      await ctx.reply('Сначала зарегистрируйтесь через /start');
      return;
    }

    const refundsCount = await prisma.payment.count({
      where: { userId: user.id, status: 'refunded' },
    });
    if (refundsCount >= MAX_REFUNDS) {
      await ctx.reply('❌ Достигнут лимит возвратов.');
      return;
    }

    const lastPayment = await prisma.payment.findFirst({
      where: { userId: user.id, status: 'paid' },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastPayment) {
      await ctx.reply('Нет платежей для возврата.');
      return;
    }

    const windowMs = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - lastPayment.createdAt.getTime() > windowMs) {
      await ctx.reply('❌ С момента оплаты прошло больше 21 дня — возврат недоступен.');
      return;
    }

    await bot.telegram.refundStarPayment(userId, lastPayment.txId);

    await prisma.payment.update({
      where: { id: lastPayment.id },
      data: { status: 'refunded' },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { subscribed: false, expiresAt: null },
    });

    await ctx.reply(`✅ Возврат ${lastPayment.amount} Stars выполнен, подписка отключена.`);
  } catch (error) {
    console.error('Ошибка возврата:', error);
    await ctx.reply('❌ Не удалось выполнить возврат. Попробуйте позже.');
  }
});

export { bot, prisma };