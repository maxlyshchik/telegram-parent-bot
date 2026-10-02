import { bot } from './bot.js';

export const commands = [
    { command: 'start',     description: '🚀 Запустить бота и зарегистрироваться' },
    { command: 'about',     description: '👶 О боте и для кого он' },
    { command: 'tip',       description: '💡 Случайный совет для родителей' },
    { command: 'generate',  description: '✨ Сгенерировать новый совет' },
    { command: 'game',      description: '🎮 Игра на 15 минут' },
    { command: 'craft',     description: '✂️ Поделка на 15 минут' },
    { command: 'recipe',    description: '🍳 Рецепт на 15 минут' },
    { command: 'book',      description: '📚 Книга на 15 минут' },
    { command: 'subscribe', description: '⭐️ Оформить подписку' },
    { command: 'refund',    description: '↩️ Вернуть оплату' },
    { command: 'help',      description: '❓ Помощь' },
];

export async function setBotCommands() {
    try {
        await bot.telegram.setMyCommands(commands);
        console.log('✅ Меню команд обновлено');
    } catch (error) {
        console.error('❌ Не удалось обновить меню команд:', error);
    }
}
