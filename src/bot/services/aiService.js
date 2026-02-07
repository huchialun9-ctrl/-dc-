const OpenAI = require('openai');
const logger = require('../../core/logger');

let openai = null;

const init = () => {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        });
        logger.info('✅ AI (OpenAI/OpenRouter) Service Initialized');
    } else {
        logger.warn('⚠️ OPENAI_API_KEY missing or placeholder. AI features will be limited.');
    }
};

/**
 * Parses a natural language description of a Discord server into a structured JSON.
 * @param {string} description 
 * @param {Object} settings Optional settings (language, template)
 * @returns {Promise<Object>}
 */
const parseServerStructure = async (description, settings = {}) => {
    console.log('[aiService.parseServerStructure] Called', { description, settings, openaiInitialized: !!openai });

    if (!openai) {
        const error = "AI 系統尚未設定 (API Key Missing)";
        console.error('[aiService] OpenAI client not initialized');
        return { error };
    }

    const { language = 'Traditional Chinese', template = '' } = settings;

    try {
        console.log('[aiService] Making API request to OpenAI/OpenRouter...');
        const response = await openai.chat.completions.create({
            model: "openai/gpt-4o",
            max_tokens: 1500, // Reduced to minimize quota usage
            temperature: 0.7,
            messages: [
                {
                    role: "system",
                    content: `You are a Discord server architect. Generate a JSON structure for server creation.
                    Required JSON format:
                    {
                      "categories": [{"name": "Category", "channels": [{"name": "channel-name", "type": "text|voice", "topic": "description"}]}],
                      "roles": [{"name": "Role", "color": "#HEX", "hoist": true}],
                      "rules": ["Rule text"],
                      "welcomeMessage": "Welcome text"
                    }
                    Output language: ${language}. ${template ? 'Style: ' + template : ''} Output JSON only.`
                },
                {
                    role: "user",
                    content: description
                }
            ],
            response_format: { type: "json_object" }
        });

        console.log('[aiService] API request successful');
        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error('[aiService] API Error Details:', {
            message: error.message,
            status: error.status,
            type: error.type,
            code: error.code,
            responseData: error.response?.data,
            stack: error.stack
        });
        logger.error(`AI Parsing Error: ${error.message}`);
        return { error: error.message };
    }
};

module.exports = { init, parseServerStructure };
