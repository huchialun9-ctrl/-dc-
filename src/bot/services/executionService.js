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
        // 1. Create Roles
        if (structure.roles && Array.isArray(structure.roles)) {
            for (const roleData of structure.roles) {
                logger.info(`Creating role: ${roleData.name}`);
                await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color || '#99aab5',
                    hoist: roleData.hoist || false,
                    reason: 'AI Orchestrated Server Setup'
                });
                await sleep(500); // Prevent rate limits
            }
        }

        // 2. Create Categories and Channels
        for (const categoryData of structure.categories) {
            logger.info(`Creating category: ${categoryData.name}`);

            const category = await guild.channels.create({
                name: categoryData.name,
                type: ChannelType.GuildCategory,
            });

            await sleep(1000);

            for (const channelData of categoryData.channels) {
                logger.info(`Creating channel: ${channelData.name} in ${categoryData.name}`);

                await guild.channels.create({
                    name: channelData.name,
                    type: channelData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
                    topic: channelData.topic || '',
                    parent: category.id
                });

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
