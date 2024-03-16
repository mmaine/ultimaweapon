// jailedCommand.js
const { EmbedBuilder } = require('discord.js');
const { allowedRoleIds } = require('../config');
const { getJailedUsers, getJailHistory } = require('../utils/storage');

exports.handleJailedCommand = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const hasPermission = allowedRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

    if (!hasPermission) {
        await interaction.editReply({ content: "You don't have permission to view jail history." });
        return;
    }

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
        const embed = new EmbedBuilder()
            .setTitle('Currently Jailed Users')
            .setDescription(Object.entries(jailedUsers).map(([userId, details]) => `• <@${userId}>: Jailed until <t:${Math.floor(details.unjailTime / 1000)}:R>`).join('\n') || 'No users currently jailed.')
            .setColor('#0099ff');

        await interaction.editReply({ embeds: [embed] });
    }
};
