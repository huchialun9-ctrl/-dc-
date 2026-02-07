require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

async function testAPI() {
    console.log('Testing OpenRouter API...');
    console.log('API Key:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');
    console.log('Base URL:', process.env.OPENAI_BASE_URL);

    try {
        const response = await openai.chat.completions.create({
            model: "openai/gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Respond in JSON format."
                },
                {
                    role: "user",
                    content: "Create a simple test structure with one category"
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 500
        });

        console.log('\n✅ SUCCESS!');
        console.log('Response:', JSON.stringify(response.choices[0].message.content, null, 2));
    } catch (error) {
        console.error('\n❌ ERROR:');
        console.error('Message:', error.message);
        console.error('Status:', error.status);
        console.error('Type:', error.type);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testAPI();
