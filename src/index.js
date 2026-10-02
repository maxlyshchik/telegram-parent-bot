import { bot } from './bot.js';
import { setBotCommands } from './commands.js';
import './scheduler.js';

async function main() {
    // Устанавливаем меню команд ДО запуска — Telegram подтянет его при следующем /start
    await setBotCommands();

    await bot.launch();
    console.log('Бот успешно запущен!');
}

main().catch((err) => {
    console.error('Ошибка при запуске бота:', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));