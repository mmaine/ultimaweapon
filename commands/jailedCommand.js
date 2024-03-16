const { EmbedBuilder } = require('discord.js');
const { getJailedUsers, getJailHistory } = require('../utils/storage');

exports.handleJailedCommand = async (interaction) => {
    const user = interaction.options.getUser('user');
    const jailHistory = getJailHistory();

    if (user) {
        const history = jailHistory[user.id] || [];
        const embed = new EmbedBuilder()
            .setTitle(`Jail history for ${user.tag}`)
            .setDescription(history.map(h => `• **By:** ${h.by}, **Reason:** ${h.reason}, **Duration:** ${h.duration}`).join('\n') || 'No jail history.')
            .setColor('#0099ff');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
        const jailedUsers = getJailedUsers();
        const description = Object.keys(jailedUsers).map(userId => `• <@${userId}> (Jailed ${jailedUsers[userId].count} times)`).join('\n') || 'No users currently jailed.';
        const embed = new EmbedBuilder()
            .setTitle('Currently Jailed Users')
            .setDescription(description)
            .setColor('#0099ff');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
