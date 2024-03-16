const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('./config');
const { handleJailCommand } = require('./commands/jailCommand');
const { handleJailedCommand } = require('./commands/jailedCommand');
const { checkUnjailOnStart } = require('./utils/unjailCheck');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await checkUnjailOnStart(client);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    switch (interaction.commandName) {
        case 'jail':
            await handleJailCommand(interaction);
            break;
        case 'jailed':
            await handleJailedCommand(interaction);
            break;
    }
});

client.login(token);
