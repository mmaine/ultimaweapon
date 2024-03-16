const { Client, GatewayIntentBits, Events } = require('discord.js');
const { token, muteRoleId } = require('./config');
const { handleJailCommand } = require('./commands/jailCommand');
const { handleJailedCommand } = require('./commands/jailedCommand');
const { handleUnjailCommand } = require('./commands/unjailCommand');
const { checkUnjailOnStart } = require('./utils/unjailCheck');
const { getJailedUser } = require('./utils/storage');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await checkUnjailOnStart(client);  // Check and unjail users as necessary
});

client.on(Events.InteractionCreate, async (interaction) => {
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
        default:
            console.log(`Unknown command: ${interaction.commandName}`);
            break;
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    const jailedUser = getJailedUser(member.id);
    if (jailedUser) {
        try {
            await member.roles.remove(rolesToRestoreIds); // Attempt to remove any roles they shouldn't have
            await member.roles.add(muteRoleId); // Reapply the mute role
            console.log(`Reapplied jail to ${member.user.tag} who rejoined the server.`);
        } catch (error) {
            console.error(`Failed to reapply jail to ${member.user.tag}:`, error);
        }
    }
});

client.login(token);
