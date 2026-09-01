import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
});

const recentTips = [];

// Жёсткая очистка ответа
function cleanTip(raw) {
    let cleaned = raw.trim();

    // Удаляем фразы, которые являются копией запроса или рассуждениями
    const removeRegex = /^(придумать|дай|предложи|совет|как занять|чем занять|идея:|вариант:|мы можем|давайте|например)\s*/i;
    cleaned = cleaned.replace(removeRegex, '').trim();

    // Если после удаления строка начинается с "придумать совет" – удаляем ещё раз
    cleaned = cleaned.replace(/^придумать совет\s*/i, '').trim();

    // Берём первое предложение (до . ! ?)
    const match = cleaned.match(/^[^.!?]*[.!?]/);
    if (match) {
        return match[0];
    }
    // Если есть текст, но нет знака препинания – берём первые 100 символов и добавляем точку
    if (cleaned.length > 0) {
        return cleaned.slice(0, 100) + (cleaned.length > 100 ? '…' : '.');
    }
    return ''; // если пусто
}

async function generateTip(history = []) {
    try {
        let avoidPrompt = '';
        if (history.length > 0) {
            avoidPrompt = `\nНе повторяй эти советы: ${history.join('; ')}.`;
        }

        const completion = await openai.chat.completions.create({
            model: 'deepseek-v4-flash',
            messages: [
                {
                    role: 'system',
                    content:
                        'Ты — помощник для родителей детей от 1 до 6 лет. Давай короткие, полезные и практичные советы на тему «чем занять ребёнка на 15 минут». Сразу пиши ответ без размышлений.',
                },
                { role: 'user', content: 'Придумай новый оригинальный совет.' },
            ],
            temperature: 0.8,
            max_tokens: 1024,
        });

        let content = completion.choices[0]?.message?.content?.trim() || '';

        // Если после очистки пусто или слишком коротко (< 30 символов) – берём случайный из tips.js
        if (!content || content.length < 10) {
            const { tips } = await import('./tips.js');
            content = tips[Math.floor(Math.random() * tips.length)];
            console.warn('⚠️ Модель не дала качественного совета, использован запасной.');
        }

        // Сохраняем в историю (для избегания повторов)
        recentTips.push(content);
        if (recentTips.length > 10) recentTips.shift();

        return content;
    } catch (error) {
        console.error('Ошибка генерации совета:', error);
        const { tips } = await import('./tips.js');
        return tips[Math.floor(Math.random() * tips.length)];
    }
}

export default generateTip

export function getRecentTips() {
    return [...recentTips];
}
