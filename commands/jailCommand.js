const { parseDuration, createEmbed } = require('../utils/helpers');
const { muteRoleId, rolesToRestoreIds, logChannelId } = require('../config');
const { setJailedUser, addJailHistory } = require('../utils/storage');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

exports.handleJailCommand = async (interaction) => {
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const durationString = interaction.options.getString('duration', true);
    const duration = parseDuration(durationString);

    if (!duration) {
        await interaction.reply({ content: 'Invalid duration format. Use format like 10s, 5m, 10h, 20d.', ephemeral: true });
        return;
    }

    const guild = interaction.guild;
    const memberToJail = await guild.members.fetch(targetUser.id);
    const originalRoles = memberToJail.roles.cache.filter(role => rolesToRestoreIds.includes(role.id)).map(role => role.id);

    await memberToJail.roles.remove(originalRoles).catch(console.error);
    await memberToJail.roles.add(muteRoleId).catch(console.error);

    const unjailTime = Date.now() + duration;
    setJailedUser(targetUser.id, { originalRoles, unjailTime });
    addJailHistory(targetUser.id, { jailer: interaction.user.id, reason, durationString, timestamp: Date.now() });

    // Respond to the user who invoked the jail command
    await interaction.reply({ content: `You have jailed ${targetUser} for ${durationString}.`, ephemeral: true });

    // Construct and send the embed to the designated channel
    const embed = new EmbedBuilder()
        .setTitle(`${targetUser.tag} has been jailed.`)
        .setDescription(`${targetUser.toString()} (${targetUser.id}) has been sentenced to jail by a staff. They have lost access to the server until they are unjailed.`)
        .addFields(
            { name: 'Jailer', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Duration', value: durationString, inline: true },
            { name: 'Unjail', value: `<t:${Math.floor(unjailTime / 1000)}:F>`, inline: true },
            { name: 'Reason', value: reason, inline: false }
        )
        .setColor('#FF0000');

    const logChannel = await guild.channels.fetch(logChannelId);
    logChannel.send({ embeds: [embed] }).catch(console.error);

    // Setup auto-unjail after duration expires
    setTimeout(async () => {
        try {
            const refreshedMember = await guild.members.fetch(targetUser.id);
            await refreshedMember.roles.remove(muteRoleId).catch(console.error);
            for (const roleId of originalRoles) {
                await refreshedMember.roles.add(roleId).catch(console.error);
            }
            removeJailedUser(targetUser.id);

            // Construct and send the unjail embed message
            const unjailEmbed = new EmbedBuilder()
                .setTitle(`${targetUser.tag} has been unjailed.`)
                .setDescription(`${targetUser.toString()} (${targetUser.id}) has been released from jail. They have gained access to the server once more.`)
                .setColor('#00FF00');

            logChannel.send({ embeds: [unjailEmbed] }).catch(console.error);
        } catch (error) {
            console.error('Error during auto-unjail process:', error);
        }
    }, duration);
};
