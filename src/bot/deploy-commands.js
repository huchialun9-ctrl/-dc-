require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // 1. Fetch existing commands to identify protected Entry Points
        const existingCommands = await rest.get(
            Routes.applicationCommands(process.env.CLIENT_ID)
        );

        const entryPointCommands = existingCommands.filter(cmd => cmd.type === 4);
        console.log(`Found ${entryPointCommands.length} protected Entry Point commands.`);

        // 2. Merge protected commands with new commands
        const finalCommands = [...commands, ...entryPointCommands];

        // 3. Register all commands
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: finalCommands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
