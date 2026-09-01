import cron from 'node-cron';
import generateTip from './deepseek.js';
import { bot } from './bot.js';

const CHANNEL_ID = process.env.CHANNEL_ID;

if (!CHANNEL_ID) {
    console.error('❌ CHANNEL_ID не задан в .env! Планировщик не запустится.');
    process.exit(1);
}

async function postDailyTip() {
    try {
        console.log('🕘 Запуск генерации и публикации совета...');

        // Генерируем совет через DeepSeek
        const tip = await generateTip();

        // Отправляем в канал
        await bot.telegram.sendMessage(
            CHANNEL_ID,
            `📌 *Ежедневный совет для родителей:*\n\n${tip}`,
            { parse_mode: 'Markdown' }
        );

        console.log('✅ Совет успешно опубликован в канале');
    } catch (error) {
        console.error('❌ Ошибка при публикации совета:', error);
    }
}

// === НАСТРОЙКА РАСПИСАНИЯ ===

// 1. Основное расписание: каждый день в 9:00 утра (по времени сервера)
cron.schedule('0 9 * * *', postDailyTip);

// 2. Для теста: запускаем каждую минуту (раскомментируй, чтобы проверить, закомментируй после)
cron.schedule('* * * * *', postDailyTip);

console.log('⏰ Планировщик задач запущен. Ожидаем ежедневной публикации в 9:00.');