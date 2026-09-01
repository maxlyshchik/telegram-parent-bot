import { bot } from './bot.js';
import './scheduler.js';

bot.launch()
    .then(() => {
      console.log('Бот успешно запущен!');
    })
    .catch((err) => {
      console.error('Ошибка при запуске бота:', err);
    });

// Включаем "graceful stop" для корректного завершения
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));