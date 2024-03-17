// jailedCommand.js
const { EmbedBuilder } = require('discord.js');
const { allowedRoleIds } = require('../config');
const { getJailedUsers, getJailHistory } = require('../utils/storage');

exports.handleJailedCommand = async (interaction) => {
    const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));

    if (!hasPermission) {
        await interaction.reply({ content: "You don't have permission to view jail history.", ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');
    if (user) {
        const jailHistory = getJailHistory(user.id);
        const embed = new EmbedBuilder()
            .setTitle(`Jail history for ${user.tag}`)
            .setDescription(jailHistory.map(h => `By: <@${h.jailerId}>, Reason: ${h.reason}, Duration: ${h.durationString}, Date: <t:${Math.floor(h.timestamp / 1000)}:f>`).join('\n') || 'No jail history.')
            .setColor('#0099ff');

        await interaction.editReply({ embeds: [embed] });
    } else {
        const jailedUsers = getJailedUsers();
        const embedDescriptions = Object.entries(jailedUsers)
            .map(([userId, details]) => `• <@${userId}>: Jailed until <t:${Math.floor(details.unjailTime / 1000)}:R>`)
            .join('\n') || 'No users currently jailed.';
        const embed = new EmbedBuilder()
            .setTitle('Currently Jailed Users')
            .setDescription(embedDescriptions)
            .setColor('#0099ff');

        await interaction.editReply({ embeds: [embed] });
    }
};
