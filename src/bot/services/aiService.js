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
    if (!openai) return { error: "AI 系統尚未設定 (API Key Missing)" };

    const { language = 'Traditional Chinese', template = '' } = settings;

    try {
        const response = await openai.chat.completions.create({
            model: "openai/gpt-4o",
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

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        logger.error(`AI Parsing Error: ${error.message}`);
        return { error: error.message };
    }
};

module.exports = { init, parseServerStructure };
