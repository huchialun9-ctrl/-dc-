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
            max_tokens: 3000, // Limit to prevent quota issues
            messages: [
                {
                    role: "system",
                    content: `You are a Discord server architect. Parse the user's description into a structured JSON format for creating a server.
                    The JSON must follow this structure:
                    {
                      "categories": [
                        {
                          "name": "Category Name",
                          "channels": [
                            { "name": "channel-name", "type": "text", "topic": "Brief channel description" },
                            { "name": "voice-channel", "type": "voice" }
                          ]
                        }
                      ],
                      "roles": [
                        { "name": "Role Name", "color": "#HEXCLR", "hoist": true }
                      ],
                      "rules": ["Rule 1", "Rule 2"],
                      "welcomeMessage": "Custom greeting"
                    }
                    Rules:
                    1. Channel types must be 'text' or 'voice'.
                    2. Use lowercase with hyphens for channel names.
                    3. Output names and content in ${language}.
                    4. Role colors should be hexadecimal.
                    ${template ? `5. Follow this text template/style: ${template}` : ''}
                    6. Strictly output JSON only.`
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
