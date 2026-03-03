const fetch = require('node-fetch');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testModel(model) {
    console.log(`Testing model: ${model}...`);
    const versions = ['v1', 'v1beta'];
    for (const v of versions) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/${v}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Hello!" }] }]
                    }),
                }
            );
            const data = await response.json();
            if (response.ok) {
                console.log(`✅ Success with ${model} on ${v}:`, data.candidates[0].content.parts[0].text.trim());
                return true;
            } else {
                console.log(`❌ Fail with ${model} on ${v}: ${data.error?.message || response.statusText}`);
            }
        } catch (e) {
            console.log(`❌ Error with ${model} on ${v}: ${e.message}`);
        }
    }
    return false;
}

async function runTests() {
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY is missing');
        return;
    }
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    for (const model of models) {
        if (await testModel(model)) break;
    }
}

runTests();
