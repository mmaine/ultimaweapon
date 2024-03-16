const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId, guildId, muteRoleId, rolesToRestoreIds } = require('./config');
const { handleJailCommand } = require('./commands/jailCommand');
const { handleJailedCommand } = require('./commands/jailedCommand');
const { handleUnjailCommand } = require('./commands/unjailCommand');
const { checkUnjailOnStart } = require('./utils/unjailCheck');
const { getJailedUser } = require('./utils/storage');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const commands = [
    {
        name: 'jail',
        description: 'Jails a user',
        options: [
            {
                name: 'user',
                type: 6, // USER
                description: 'The user to jail',
                required: true,
            },
            {
                name: 'reason',
                type: 3, // STRING
                description: 'The reason for jailing',
                required: true,
            },
            {
                name: 'duration',
                type: 3, // STRING, assuming this is meant to be a string like "1d" or "4h"
                description: 'The duration of the jail',
                required: true,
            },
        ],
    },
    {
        name: 'jailed',
        description: 'Shows jailed users or jail history for a user',
        options: [
            {
                name: 'user',
                type: 6, // USER
                description: 'The user to get history for',
                required: false,
            },
        ],
    },
    {
        name: 'unjail',
        description: 'Unjails a user',
        options: [
            {
                name: 'user',
                type: 6, // USER
                description: 'The user to unjail',
                required: true,
            },
            {
                name: 'reason',
                type: 3, // STRING
                description: 'The reason for unjailing',
                required: true,
            },
        ],
    }
];


const rest = new REST({ version: '9' }).setToken(token);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

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
        case 'unjail':
            await handleUnjailCommand(interaction);
            break;
    }
});

client.on('error', (error) => {
    console.error('An error occurred:', error);
    // Here you can add code to send a message to a specific channel if needed
    const errorLogChannel = client.channels.cache.get('1218477919777718272'); // Replace with your actual error log channel ID
    if (errorLogChannel) {
        errorLogChannel.send(`An error occurred: ${error.message}`);
    }
});


client.on('guildMemberAdd', async (member) => {
    const jailedUser = getJailedUser(member.id);
    if (jailedUser) {
        try {
            await member.roles.remove(rolesToRestoreIds);
            await member.roles.add(muteRoleId);
            console.log(`Reapplied jail to ${member.user.tag} who rejoined the server.`);
        } catch (error) {
            console.error(`Failed to reapply jail to ${member.user.tag}:`, error);
        }
    }
});

client.login(token);
