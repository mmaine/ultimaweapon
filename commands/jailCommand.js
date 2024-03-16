const { parseDuration } = require('../utils/helpers');
const { muteRoleId, rolesToRestoreIds, logChannelId } = require('../config');
const { setJailedUser, addJailHistory, removeJailedUser } = require('../utils/storage');
const { EmbedBuilder } = require('discord.js');

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

    await memberToJail.roles.remove(originalRoles);
    await memberToJail.roles.add(muteRoleId);

    const unjailTime = Date.now() + duration;
    setJailedUser(targetUser.id, { originalRoles, unjailTime, guildId: guild.id });
    addJailHistory(targetUser.id, { jailer: interaction.user.id, reason, durationString, timestamp: Date.now() });

    // DM to the jailed user
    const jailMessage = `You have been jailed in LPDU. 

**What does this mean?**
You've been assigned the Citadel Siege -role, which removes your access to view and post in channels. Once your jail has expired, your role will be removed and you will regain access to the channels.

**Why did this happen?**
In 99% of cases, you broke rules often enough to warrant a timeout from the server.

**When am I getting off the role?**
<t:${Math.floor(unjailTime / 1000)}:F> is when you will be able to access LPDU again. If your role has not been removed at the given time, you may inquire via #create-a-ticket and reach out to staff.`;

    try {
        await targetUser.send(jailMessage);
    } catch (error) {
        console.error(`Could not send DM to ${targetUser.tag}:`, error);
    }

    await interaction.reply({ content: `You have jailed ${targetUser} for ${durationString}.`, ephemeral: true });

    const embed = new EmbedBuilder()
    .setTitle(`${targetUser.tag} has been jailed.`)
    .setDescription(`${targetUser.toString()} (${targetUser.id}) has been sentenced to jail by staff. They have lost access to the server until they are unjailed.`)
    .setThumbnail(targetUser.displayAvatarURL()) // Set the jailed user's profile picture as the thumbnail
    .addFields(
        { name: 'Jailer', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
        //{ name: 'Jailer Profile', value: `[View Profile](${interaction.user.displayAvatarURL()})`, inline: true }, // Link to view jailer's profile picture
        { name: 'Duration', value: durationString, inline: true },
        { name: 'Unjail', value: `<t:${Math.floor(unjailTime / 1000)}:F>`, inline: true },
        { name: 'Reason', value: reason, inline: false }
    )
    .setColor('#FF0000');

const logChannel = await guild.channels.fetch(logChannelId);
await logChannel.send({ embeds: [embed] });

    // Setting up auto-unjail with setTimeout
    setTimeout(async () => {
        try {
            const refreshedMember = await guild.members.fetch(targetUser.id);
            await refreshedMember.roles.remove(muteRoleId);
            originalRoles.forEach(async (roleId) => {
                await refreshedMember.roles.add(roleId);
            });
            removeJailedUser(targetUser.id);
    
            // Construct and send the unjail notification to the log channel
            const unjailEmbed = new EmbedBuilder()
                .setTitle(`${targetUser.tag} has been unjailed.`)
                .setDescription(`${targetUser.toString()} (${targetUser.id}) has regained access to the server.`)
                .setThumbnail(targetUser.displayAvatarURL()) // Set the unjailed user's profile picture as the thumbnail
                .setColor('#00FF00');
            await logChannel.send({ embeds: [unjailEmbed] });
        } catch (error) {
            console.error('Failed to unjail user:', error);
        }
    }, duration);
    
};
