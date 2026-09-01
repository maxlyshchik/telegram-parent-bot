import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
});

export async function generateTip() {
    try {
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

        const message = completion.choices[0]?.message;
        const content = message?.content?.trim();
        const reasoning = message?.reasoning_content?.trim();

        const answer = content || reasoning;

        if (!answer) {
            console.error('Модель вернула пустой ответ.', JSON.stringify(completion, null, 2));
            return 'Не удалось сгенерировать совет. Попробуйте позже.';
        }

        return answer;
    } catch (error) {
        console.error('Ошибка генерации совета:', error);
        return 'Не удалось сгенерировать совет. Попробуйте позже.';
    }
}