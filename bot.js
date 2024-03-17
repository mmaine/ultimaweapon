const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId, guildId, muteRoleId, rolesToRestoreIds, logChannelId } = require('./config');
const { handleJailCommand } = require('./commands/jailCommand');
const { handleJailedCommand } = require('./commands/jailedCommand');
const { handleUnjailCommand } = require('./commands/unjailCommand');
const { handleWarnCommand } = require('./commands/warnCommand');
const { handleWarningsCommand } = require('./commands/warningsCommand');
const { handleRemoveWarningCommand } = require('./commands/removeWarningCommand');
const { startJailCheckSchedule, decayWarnings } = require('./utils/jailSchedule');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

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
                type: 3, // STRING
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
    },
    {
        name: 'warn',
        description: 'Warns a user',
        options: [
            {
                name: 'user',
                type: 6, // USER
                description: 'The user to warn',
                required: true,
            },
            {
                name: 'reason',
                type: 3, // STRING
                description: 'The reason for the warning',
                required: true,
            },
            {
                name: 'severity',
                type: 4, // INTEGER
                description: 'The severity of the warning (1-100)',
                required: true,
            },
        ],
    },
    {
        name: 'warnings',
        description: 'Displays warning history',
        options: [
            {
                name: 'user',
                type: 6, // USER
                description: 'View warnings for a specific user',
                required: false,
            },
        ],
    },
    {
        name: 'removewarning',
        description: 'Removes a specific warning from a user',
        options: [
            {
                name: 'user',
                type: 6, // USER
                description: 'The user from whom to remove the warning',
                required: true,
            },
            {
                name: 'index',
                type: 4, // INTEGER
                description: 'The index of the warning to remove (starting from 1)',
                required: true,
            },
        ],
    },
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

    startJailCheckSchedule(client); // Start the scheduled checks for jailing and unjailing
    setInterval(() => decayWarnings(client), 10000); // Adjust as necessary for your needs, currently every 10 seconds for testing
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
        case 'warn':
            await handleWarnCommand(interaction);
            break;
        case 'warnings':
            await handleWarningsCommand(interaction);
            break;
        case 'removewarning':
            await handleRemoveWarningCommand(interaction);
            break;
        // Include additional commands as needed.
    }
});

client.on('guildMemberAdd', async (member) => {
    // Reapply jail to rejoining members if they are still listed as jailed.
    const jailedUser = await getJailedUser(member.id);
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

client.on('error', (error) => {
    console.error('An error occurred:', error);
    // Error logging to a specific channel can be implemented here if needed.
});

client.login(token);
