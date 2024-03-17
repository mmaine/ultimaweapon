const { EmbedBuilder } = require('discord.js');
const {
    getJailedUser,
    removeJailedUser,
    getWarnings,
    setWarnings,
    getTotalSeverity,
    getHighestSeverityReached,
    setHighestSeverityReached
} = require('../utils/storage');
const { allowedRoleIds, logChannelId, warningThresholds, muteRoleId, rolesToRestoreIds } = require('../config');
const { jailUser } = require('./jailCommand');

exports.handleRemoveWarningCommand = async (interaction) => {
    const hasPermission = allowedRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));
    if (!hasPermission) {
        return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user', true);
    const warningIndex = interaction.options.getInteger('index', true) - 1; // Index provided by user
    
    const allWarnings = getWarnings();
    const currentWarnings = allWarnings[targetUser.id] || []; // Get specific user's warnings
    
    // Debug log - Can be removed later
    console.log(`Current warnings for ${targetUser.tag}:`, JSON.stringify(currentWarnings));
    
    if (warningIndex >= currentWarnings.length || warningIndex < 0) {
        return interaction.reply({ content: "Invalid warning index.", ephemeral: true });
    }

    currentWarnings.splice(warningIndex, 1); // Remove the specified warning
    setWarnings(targetUser.id, currentWarnings); // Update the warnings in storage

    const newTotalSeverity = getTotalSeverity(targetUser.id);
    setHighestSeverityReached(targetUser.id, newTotalSeverity);

    // Fetch the log channel early to ensure it's available when needed
    const guild = await interaction.guild;
    const logChannel = await guild.channels.fetch(logChannelId);

    const jailedUser = getJailedUser(targetUser.id);
    if (jailedUser && newTotalSeverity < warningThresholds.find(threshold => jailedUser.severity >= threshold.severity)?.severity) {
        await removeJailedUser(targetUser.id); // Remove from jailed list
        
        const member = await guild.members.fetch(targetUser.id);
        await member.roles.remove(muteRoleId); // Remove jail role
        for (const roleId of jailedUser.originalRoles) {
            await member.roles.add(roleId); // Restore original roles
        }

        // Notify in log channel
        const unjailEmbed = new EmbedBuilder()
            .setTitle(`${targetUser.tag} has been unjailed.`)
            .setDescription(`Total severity has dropped below threshold.`)
            .setColor('#00FF00'); // Green color for unjail notification
        await logChannel.send({ embeds: [unjailEmbed] });
    }

    // Respond to the user who invoked the command
    await interaction.reply({ content: `Warning #${warningIndex + 1} removed from ${targetUser.tag}. Total severity is now ${newTotalSeverity}.`, ephemeral: false });

    // Log the warning removal
    const removeWarningEmbed = new EmbedBuilder()
        .setTitle('Warning Removed')
        .setDescription(`${targetUser.tag} has had a warning removed.`)
        .addFields({ name: 'Removed by', value: `${interaction.user.tag}`, inline: true }, { name: 'New Total Severity', value: `${newTotalSeverity}`, inline: true })
        .setColor('#FFA500');
    await logChannel.send({ embeds: [removeWarningEmbed] });
};
