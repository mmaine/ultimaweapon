const { EmbedBuilder } = require('discord.js');
const { getJailedUsers, getJailHistory } = require('../utils/storage');

exports.handleJailedCommand = async (interaction) => {
    const user = interaction.options.getUser('user');
    const jailHistory = getJailHistory();  // Assuming this returns an object where keys are user IDs

    if (user) {
        // Fetch jail history for the specific user
        const history = jailHistory[user.id] || [];
        const embed = new EmbedBuilder()
            .setTitle(`Jail history for ${user.tag}`)
            .setDescription(history.map(h => `• **By:** <@${h.jailerId}>, **Reason:** ${h.reason}, **Duration:** ${h.durationString}`).join('\n') || 'No jail history.')
            .setColor('#0099ff');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
        // Display all currently jailed users
        const jailedUsers = getJailedUsers();  // Assuming this returns an object where keys are user IDs and values are jail details
        const description = Object.entries(jailedUsers).map(([userId, details]) => `• <@${userId}> (Jailed for: ${details.durationString}, Reason: ${details.reason})`).join('\n') || 'No users currently jailed.';
        const embed = new EmbedBuilder()
            .setTitle('Currently Jailed Users')
            .setDescription(description)
            .setColor('#0099ff');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
