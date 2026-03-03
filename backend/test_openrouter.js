const fetch = require('node-fetch');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;

async function testModel(model) {
    console.log(`Testing model: ${model}...`);
    try {
        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'LinkLens Test',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: 'Say "Hi"' }],
                }),
            }
        );
        const data = await response.json().catch(() => ({ error: 'Not JSON' }));
        if (response.ok && data.choices?.[0]?.message?.content) {
            console.log(`✅ Success with ${model}: ${data.choices[0].message.content}`);
            return true;
        } else {
            console.log(`❌ Fail with ${model}: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log(`❌ Error with ${model}: ${e.message}`);
    }
    return false;
}

async function runTests() {
    if (!OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY is missing');
        return;
    }
    console.log('API Key starts with:', OPENROUTER_API_KEY.substring(0, 10));

    const models = ['openai/gpt-oss-120b:free', 'google/gemini-2.0-flash-exp:free', 'deepseek/deepseek-chat'];
    for (const m of models) {
        if (await testModel(m)) break;
    }
}

runTests();
