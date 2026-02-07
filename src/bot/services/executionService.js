const { ChannelType } = require('discord.js');
const logger = require('../../core/logger');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes the server building plan.
 * @param {import('discord.js').Guild} guild 
 * @param {Object} structure - The JSON structure from AI
 */
const executeBuild = async (guild, structure) => {
    logger.info(`🚀 Starting build for guild: ${guild.name} (${guild.id})`);

    try {
        for (const categoryData of structure.categories) {
            logger.info(`Creating category: ${categoryData.name}`);

            const category = await guild.channels.create({
                name: categoryData.name,
                type: ChannelType.GuildCategory,
            });

            // Delay to prevent 429
            await sleep(1000);

            for (const channelData of categoryData.channels) {
                logger.info(`Creating channel: ${channelData.name} in ${categoryData.name}`);

                await guild.channels.create({
                    name: channelData.name,
                    type: channelData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
                    parent: category.id
                });

                // Delay to prevent 429
                await sleep(500);
            }
        }
        logger.info(`✅ Successfully built server structure for ${guild.name}`);
        return { success: true };
    } catch (error) {
        logger.error(`❌ Build Execution Error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

module.exports = { executeBuild };
