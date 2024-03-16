const { parseDuration, createEmbed } = require('../utils/helpers');
const { muteRoleId, rolesToRestoreIds, logChannelId } = require('../config');
const { setJailedUser, removeJailedUser, addJailHistory } = require('../utils/storage');
const { EmbedBuilder } = require('discord.js');

// Function to jail a user
async function jailUser(guild, targetUser, reason, duration, rolesToRestore, muteRole, invokingUser) {
    try {
        const memberToJail = await guild.members.fetch(targetUser.id);
        const userRoles = memberToJail.roles.cache.map(role => role.id);

        const removedRoles = [];
        for (const roleId of rolesToRestore) {
            if (userRoles.includes(roleId)) {
                const role = await guild.roles.fetch(roleId);
                await memberToJail.roles.remove(role);
                removedRoles.push(roleId);
            }
        }

        const muteRoleInstance = await guild.roles.fetch(muteRole);
        await memberToJail.roles.add(muteRoleInstance);

        // Save the jail information
        setJailedUser(targetUser.id, {
            userId: targetUser.id,
            guildId: guild.id,
            originalRoles: removedRoles,
            unjailTime: Date.now() + duration,
            reason: reason,
            by: invokingUser.tag,
            count: (removedRoles.length || 0) + 1  // Increment jail count
        });

        // Add to jail history
        addJailHistory(targetUser.id, {
            by: invokingUser.tag,
            reason: reason,
            duration: `${duration / 1000}s`,  // Convert milliseconds to seconds for display
            timestamp: new Date()
        });

        // Log jailing
        const jailEmbed = createEmbed({
            title: 'User Jailed',
            description: `${targetUser.tag} (${targetUser.id}) has been jailed by ${invokingUser.tag} (${invokingUser.id}) for ${reason}.`,
            fields: [{ name: 'Duration', value: `${duration / 1000}s`, inline: true }],
            thumbnail: targetUser.displayAvatarURL()
        });

        const logChannel = await guild.channels.fetch(logChannelId);
        if (logChannel && logChannel.isTextBased()) {
            await logChannel.send({ embeds: [jailEmbed] });
        }

        // Setup auto-unjail after duration expires
        setTimeout(async () => {
            const refreshedMember = await guild.members.fetch(targetUser.id);
            await refreshedMember.roles.remove(muteRoleInstance);
            for (const roleId of removedRoles) {
                const role = await guild.roles.fetch(roleId);
                await refreshedMember.roles.add(role);
            }

            // Remove the jail information
            removeJailedUser(targetUser.id);

            // Log unjailing
            const unjailEmbed = createEmbed({
                title: 'User Unjailed',
                description: `${targetUser.tag} (${targetUser.id}) has been released from jail.`,
                fields: [],
                thumbnail: targetUser.displayAvatarURL()
            });

            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send({ embeds: [unjailEmbed] });
            }
        }, duration);

        return { success: true };
    } catch (error) {
        console.error('Error occurred while jailing user:', error);
        return { success: false, error: error };
    }
}

exports.handleJailCommand = async (interaction) => {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const durationString = interaction.options.getString('duration', true);
    const duration = parseDuration(durationString);

    if (!duration) {
        await interaction.reply({ content: 'Invalid duration format. Use format like 10s, 5m, 10h, 20d.', ephemeral: true });
        return;
    }

    const invokingUser = interaction.user;  // User who invoked the jail command
    const result = await jailUser(interaction.guild, user, reason, duration, rolesToRestoreIds, muteRoleId, invokingUser);

    if (result.success) {
        await interaction.reply({ content: `${user} has been jailed for ${durationString}. Reason: ${reason}.`, ephemeral: false });
    } else {
        await interaction.reply({ content: 'An error occurred while jailing the user. Please check the console for more details.', ephemeral: true });
    }
};
