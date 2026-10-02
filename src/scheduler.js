import cron from 'node-cron';
import generateTip from './deepseek.js';
import { bot } from './bot.js';
import { nextGameTip, nextCraftTip, nextRecipeTip, nextBookTip } from './tipRotators.js';

const CHANNEL_ID = process.env.CHANNEL_ID;

if (!CHANNEL_ID) {
    console.error('❌ CHANNEL_ID не задан в .env! Планировщик не запустится.');
    process.exit(1);
}

// === Общая функция отправки ===
async function sendTip(header, tip) {
    try {
        await bot.telegram.sendMessage(
            CHANNEL_ID,
            `${header}\n\n${tip}`,
            { parse_mode: 'Markdown' }
        );
        console.log(`✅ Опубликовано: ${header}`);
    } catch (error) {
        console.error(`❌ Ошибка публикации "${header}":`, error);
    }
}

// === Публикация сгенерированного совета (DeepSeek) ===
async function postDailyTip() {
    try {
        console.log('🕘 Запуск генерации и публикации совета...');
        const tip = await generateTip();
        await sendTip('📌 *Ежедневный совет для родителей:*', tip);
    } catch (error) {
        console.error('❌ Ошибка при публикации совета:', error);
    }
}

// === Публикации из локальных массивов ===
async function postGameTip()   { await sendTip('🎮 *Игра на 15 минут:*',   nextGameTip());   }
async function postRecipeTip() { await sendTip('🍳 *Рецепт на 15 минут:*', nextRecipeTip()); }
async function postCraftTip()  { await sendTip('✂️ *Поделка на 15 минут:*', nextCraftTip()); }
async function postBookTip()   { await sendTip('📚 *Книга на 15 минут:*',  nextBookTip());   }

// === РАСПИСАНИЕ ===
// 08:30 — сгенерированный совет (DeepSeek)
cron.schedule('30 8 * * *', postDailyTip);

// 10:30 — игры
cron.schedule('30 10 * * *', postGameTip);

// 12:00 — рецепты
cron.schedule('0 12 * * *', postRecipeTip);

// 15:30 — поделки
cron.schedule('30 15 * * *', postCraftTip);

// 19:30 — книги
cron.schedule('30 19 * * *', postBookTip);

// Для теста (раскомментируй при отладке):
// cron.schedule('* * * * *', postGameTip);

console.log('⏰ Планировщик запущен:');
console.log('   08:30 — DeepSeek-совет');
console.log('   10:30 — игры');
console.log('   12:00 — рецепты');
console.log('   15:30 — поделки');
console.log('   19:30 — книги');
