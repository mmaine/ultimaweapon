const { EmbedBuilder } = require('discord.js');
const {
    addWarning,
    getTotalSeverity,
    getJailedUser,
    setJailedUser,
    addJailHistory,
    getHighestSeverityReached,
    setHighestSeverityReached
} = require('../utils/storage');
const { warningThresholds, allowedRoleIds, logChannelId } = require('../config');
const { jailUser } = require('./jailCommand');

exports.handleWarnCommand = async (interaction) => {
    if (!interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id))) {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: false });

    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const severity = interaction.options.getInteger('severity', true);

    addWarning(targetUser.id, { reason, severity, warnedBy: interaction.user.id, timestamp: Date.now() });
    const totalSeverity = getTotalSeverity(targetUser.id);
    const previousHighestSeverity = getHighestSeverityReached(targetUser.id) || 0;
    setHighestSeverityReached(targetUser.id, totalSeverity);

    const newThresholds = warningThresholds
        .filter(threshold => totalSeverity >= threshold.severity && previousHighestSeverity < threshold.severity)
        .sort((a, b) => b.severity - a.severity); // Sort in descending order by severity

    if (newThresholds.length > 0 && !getJailedUser(targetUser.id)) {
        const highestNewThreshold = newThresholds[0]; // Get the highest new threshold surpassed
        await jailUser(interaction.guild, targetUser, highestNewThreshold.reason, highestNewThreshold.duration, interaction.user);
    }

    interaction.editReply({ content: `You warned ${targetUser.tag} with a severity of ${severity}. Total severity is now ${totalSeverity}.`, ephemeral: true });

    const logChannel = await interaction.guild.channels.fetch(logChannelId);
    const warnEmbed = new EmbedBuilder()
        .setTitle('User Warned')
        .setDescription(`${targetUser} (${targetUser.id}) has been warned for breaking the rules.`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
            { name: 'Severity', value: `${severity}`, inline: true },
            { name: 'Reason', value: reason, inline: true },
            { name: 'Warned by', value: `${interaction.user.tag}`, inline: true }
        )
        .setColor('#FFA500'); // Use the color appropriate for a warning
    logChannel.send({ embeds: [warnEmbed] }).catch(console.error);
};
