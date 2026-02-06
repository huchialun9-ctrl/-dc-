const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require('../../core/logger');

let model = null;

const init = () => {
    if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        logger.info('✅ AI (Gemini) Service Initialized');
    } else {
        logger.warn('⚠️ GEMINI_API_KEY missing. AI Chat will not work.');
    }
};

const generateResponse = async (prompt, context = "") => {
    if (!model) return "❌ AI 系統尚未設定 (API Key Missing)";

    try {
        const fullPrompt = context ? `${context}\nUser: ${prompt}` : prompt;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        logger.error(`AI Generation Error: ${error.message}`);
        // Return actual error for debugging
        return `❌ AI 系統暫時無法回應。\n錯誤詳情 (Error): ${error.message}`;
    }
};

module.exports = { init, generateResponse };
