const { parseDuration } = require('../utils/helpers');
const { muteRoleId, rolesToRestoreIds, logChannelId, allowedRoleIds } = require('../config');
const { setJailedUser, addJailHistory } = require('../utils/storage');
const { EmbedBuilder } = require('discord.js');

// Separated jailing logic for reuse.
async function jailUser(guild, user, reason, durationString, interactionUser) {
    const duration = parseDuration(durationString);
    if (!duration) {
        console.error('Invalid duration format for jailing.');
        return;
    }

    const memberToJail = await guild.members.fetch(user.id);
    const originalRoles = memberToJail.roles.cache.filter(role => rolesToRestoreIds.includes(role.id)).map(role => role.id);

    await memberToJail.roles.remove(originalRoles).catch(console.error);
    await memberToJail.roles.add(muteRoleId).catch(console.error);

    const unjailTime = Date.now() + duration;
    setJailedUser(user.id, { originalRoles, unjailTime, guildId: guild.id, jailerId: interactionUser.id, reason, durationString });
    addJailHistory(user.id, { jailerId: interactionUser.id, reason, durationString, timestamp: Date.now() });

    const logChannel = await guild.channels.fetch(logChannelId);
    const embed = new EmbedBuilder()
        .setTitle(`${user.tag} has been jailed.`)
        .setDescription(`${user.toString()} (${user.id}) has been sentenced to jail.`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: 'Jailer', value: `${interactionUser.tag} (${interactionUser.id})`, inline: true },
            { name: 'Duration', value: durationString, inline: true },
            { name: 'Unjail Time', value: `<t:${Math.floor(unjailTime / 1000)}:F>`, inline: true },
            { name: 'Reason', value: reason, inline: false }
        )
        .setColor('#FF0000');
    logChannel.send({ embeds: [embed] }).catch(console.error);

    const jailMessage = `You have been jailed for ${durationString} due to: ${reason}.`;
    try {
        await user.send(jailMessage);
    } catch (error) {
        console.error(`Could not send DM to ${user.tag}:`, error);
    }
}

// This handles the Discord command interaction
exports.handleJailCommand = async (interaction) => {
    if (!interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id))) {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const durationString = interaction.options.getString('duration', true);

    try {
        await jailUser(interaction.guild, user, reason, durationString, interaction.user);
        await interaction.editReply({ content: `You have jailed ${user.tag} for ${durationString}.` });
    } catch (error) {
        console.error('Jail command failed:', error);
        await interaction.editReply({ content: `Error: ${error.message}` });
    }
};

// Exporting the jailUser function for use in warnCommand and potentially others
exports.jailUser = jailUser;
